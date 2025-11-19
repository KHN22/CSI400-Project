const express = require('express');
const Movie = require('../models/Movie');
const AuditLog = require('../models/AuditLog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// helper to fetch TMDB metadata for a tmdbId
async function fetchTmdbMetadata(tmdbId) {
  try {
    const key = process.env.TMDB_API_KEY;
    if (!key) return null;
    const apiUrl = `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}?api_key=${encodeURIComponent(key)}&language=en-US`;
    let resp;
    if (typeof fetch === 'function') {
      resp = await fetch(apiUrl);
      if (!resp.ok) return null;
      const data = await resp.json();
      return data;
    }
    const https = require('https');
    resp = await new Promise((resolve, reject) => {
      https.get(apiUrl, (r) => {
        const chunks = [];
        r.on('data', c => chunks.push(c));
        r.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ status: r.statusCode, body });
        });
      }).on('error', reject);
    });
    if (resp.status < 200 || resp.status >= 300) return null;
    return JSON.parse(resp.body);
  } catch (err) {
    console.warn('fetchTmdbMetadata error', err.message || err);
    return null;
  }
}

// GET /api/movies/tmdb?tmdbId=634649 or /api/movies/tmdb?url=https://www.themoviedb.org/movie/634649-...
router.get('/tmdb', async (req, res) => {
  try {
    const key = process.env.TMDB_API_KEY;
    if (!key) return res.status(500).json({ message: 'TMDB API key not configured' });
    let tmdbId = req.query.tmdbId || null;
    const urlParam = req.query.url || req.query.tmdbUrl || '';
    if (!tmdbId && urlParam) {
      // extract numeric id from TMDB url
      const m = urlParam.match(/movie\/(\d+)/);
      if (m) tmdbId = m[1];
    }
    if (!tmdbId) return res.status(400).json({ message: 'tmdbId or url required' });

    const apiUrl = `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}?api_key=${encodeURIComponent(key)}&language=en-US`;
    // use global fetch if available
    let resp;
    if (typeof fetch === 'function') {
      resp = await fetch(apiUrl);
    } else {
      // fallback to https.request
      const https = require('https');
      resp = await new Promise((resolve, reject) => {
        https.get(apiUrl, (r) => {
          const chunks = [];
          r.on('data', c => chunks.push(c));
          r.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            resolve({ ok: r.statusCode >= 200 && r.statusCode < 300, status: r.statusCode, json: async () => JSON.parse(body) });
          });
        }).on('error', reject);
      });
    }

    if (!resp.ok) {
      const txt = await resp.text().catch(() => null);
      return res.status(502).json({ message: 'TMDB fetch failed', detail: txt || resp.status });
    }
    const data = await resp.json();
    const poster = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null;
    const year = data.release_date ? Number(String(data.release_date).split('-')[0]) : undefined;
    const length = data.runtime || undefined;
    const rating = data.vote_average || 0;
    const title = data.title || data.name || '';
    const description = data.overview || '';

    return res.json({ movie: { title, poster, year, length, rating, description, tmdbId } });
  } catch (err) {
    console.error('[Movies] TMDB fetch error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

/**
 * @openapi
 * /api/movies:
 *   get:
 *     tags:
 *       - movies
 *     summary: List all movies
 *     responses:
 *       200:
 *         description: A list of movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 */
// Public routes (ไม่ต้อง login)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const branch = req.query.branch;
    if (branch) {
      // return only movies for this branch
      filter.branch = branch;
    }
    const movies = await Movie.find(filter);
    res.json({ movies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/movies/{id}:
 *   get:
 *     tags:
 *       - movies
 *     summary: Get movie by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       404:
 *         description: Movie not found
 */
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected routes - require authentication for write operations
// We'll apply `verifyToken` per-route to allow different role checks.

/**
 * @openapi
 * /api/movies:
 *   post:
 *     tags:
 *       - movies
 *     summary: Create a new movie (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Movie'
 *     responses:
 *       201:
 *         description: Movie created
 */
// Admin/Staff/Manager routes - create movie
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('[Movies] Creating movie:', req.body);
    // ensure branch is set: for SuperAdmin, allow explicit branch in body; for others default to user's branch
    const payload = { ...req.body };
    if (req.user && req.user.role !== 'SuperAdmin') {
      payload.branch = req.user.branch || null;
    } else if (!payload.branch) {
      payload.branch = null;
    }
    payload.createdBy = req.user?._id || req.user?.id || null;
    // if poster is an external URL, download it into uploads and replace with backend URL
    try {
      if (payload.poster && typeof payload.poster === 'string' && payload.poster.startsWith('http')) {
        const base = req.protocol + '://' + req.get('host');
        // avoid re-downloading when the poster is already hosted on this backend
        if (!payload.poster.startsWith(base)) {
          const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
          fs.mkdirSync(uploadDir, { recursive: true });
          const url = payload.poster;
          const filename = `${Date.now()}-${path.basename(new URL(url).pathname)}`;
          const dest = path.join(uploadDir, filename);
          await new Promise((resolve, reject) => {
            const https = require('https');
            https.get(url, (r) => {
              if (r.statusCode < 200 || r.statusCode >= 300) return reject(new Error('Failed to download image ' + r.statusCode));
              const fileStream = fs.createWriteStream(dest);
              r.pipe(fileStream);
              fileStream.on('finish', () => { fileStream.close(resolve); });
              fileStream.on('error', reject);
            }).on('error', reject);
          });
          const rel = `/uploads/${filename}`;
          payload.poster = base + rel;
        }
      }
    } catch (e) {
      console.warn('[Movies] poster download failed:', e.message || e);
    }
    // if tmdbId provided, try to fetch TMDB rating and set as initial movie.rating
    try {
      if (payload.tmdbId) {
        const md = await fetchTmdbMetadata(payload.tmdbId);
        if (md) {
          const rating = md.vote_average || 0;
          payload.rating = Number((Math.round((rating || 0) * 10) / 10).toFixed(1));
        }
      }
    } catch (e) { console.warn('[Movies] tmdb rating fetch failed:', e.message || e); }

    const movie = new Movie(payload);
    await movie.save();
    // create audit log for adding movie
    try {
      await AuditLog.create({
        actorId: req.user?._id || req.user?.id || null,
        action: 'ADD_MOVIE',
        movieId: movie._id,
        branch: movie.branch || req.user?.branch || null,
        details: { title: movie.title }
      });
    } catch (alErr) {
      console.error('[Movies] Failed to create audit log for add movie:', alErr);
    }
    res.status(201).json({ movie });
  } catch (err) {
    console.error('[Movies] Create error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/movies/{id}:
 *   patch:
 *     tags:
 *       - movies
 *     summary: Update a movie (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Movie'
 *     responses:
 *       200:
 *         description: Movie updated
 */
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    console.log('[Movies] Updating movie:', req.params.id, req.body);
    const payload = { ...req.body };
    // if poster is an external URL, download into uploads
    try {
      if (payload.poster && typeof payload.poster === 'string' && payload.poster.startsWith('http')) {
        const base = req.protocol + '://' + req.get('host');
        if (!payload.poster.startsWith(base)) {
          const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
          fs.mkdirSync(uploadDir, { recursive: true });
          const url = payload.poster;
          const filename = `${Date.now()}-${path.basename(new URL(url).pathname)}`;
          const dest = path.join(uploadDir, filename);
          await new Promise((resolve, reject) => {
            const https = require('https');
            https.get(url, (r) => {
              if (r.statusCode < 200 || r.statusCode >= 300) return reject(new Error('Failed to download image ' + r.statusCode));
              const fileStream = fs.createWriteStream(dest);
              r.pipe(fileStream);
              fileStream.on('finish', () => { fileStream.close(resolve); });
              fileStream.on('error', reject);
            }).on('error', reject);
          });
          const rel = `/uploads/${filename}`;
          payload.poster = base + rel;
        }
      }
    } catch (e) {
      console.warn('[Movies] poster download failed (patch):', e.message || e);
    }

    // if tmdbId provided, try to fetch TMDB rating and set as initial movie.rating
    try {
      if (payload.tmdbId) {
        const md = await fetchTmdbMetadata(payload.tmdbId);
        if (md) {
          const rating = md.vote_average || 0;
          payload.rating = Number((Math.round((rating || 0) * 10) / 10).toFixed(1));
        }
      }
    } catch (e) { console.warn('[Movies] tmdb rating fetch failed (patch):', e.message || e); }

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    );
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    // check branch permission: allow if SuperAdmin or same branch
    if (req.user?.role !== 'SuperAdmin') {
      if (!req.user?.branch || String(req.user.branch) !== String(movie.branch)) {
        return res.status(403).json({ message: 'Forbidden: branch mismatch' });
      }
    }
    // create audit log for edit
    try {
      await AuditLog.create({
        actorId: req.user?._id || req.user?.id || null,
        action: 'EDIT_MOVIE',
        movieId: movie._id,
        branch: movie.branch || req.user?.branch || null,
        details: { changes: req.body }
      });
    } catch (alErr) {
      console.error('[Movies] Failed to create audit log for edit movie:', alErr);
    }

    res.json({ movie });
  } catch (err) {
    console.error('[Movies] Update error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/movies/{id}:
 *   delete:
 *     tags:
 *       - movies
 *     summary: Delete a movie (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie deleted
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    // check branch permission (deleted movie already removed, but we can check by comparing branch on returned doc)
    if (req.user?.role !== 'SuperAdmin') {
      if (!req.user?.branch || String(req.user.branch) !== String(movie.branch)) {
        return res.status(403).json({ message: 'Forbidden: branch mismatch' });
      }
    }
    // create audit log for delete
    try {
      await AuditLog.create({
        actorId: req.user?._id || req.user?.id || null,
        action: 'EDIT_MOVIE',
        movieId: movie._id,
        branch: movie.branch || req.user?.branch || null,
        details: { deleted: true, title: movie.title }
      });
    } catch (alErr) {
      console.error('[Movies] Failed to create audit log for delete movie:', alErr);
    }

    res.json({ message: 'Movie deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;