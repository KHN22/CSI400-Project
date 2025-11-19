const express = require('express');
const Movie = require('../models/Movie');
const AuditLog = require('../models/AuditLog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

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
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
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