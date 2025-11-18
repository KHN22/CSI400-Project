const express = require('express');
const Movie = require('../models/Movie');
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
    const movies = await Movie.find();
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

// Protected routes (ต้อง login และเป็น admin)
router.use(verifyToken);
router.use(requireAdmin);

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
// Admin routes
router.post('/', async (req, res) => {
  try {
    console.log('[Movies] Creating movie:', req.body);
    const movie = new Movie(req.body);
    await movie.save();
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
router.patch('/:id', async (req, res) => {
  try {
    console.log('[Movies] Updating movie:', req.params.id, req.body);
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
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
router.delete('/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;