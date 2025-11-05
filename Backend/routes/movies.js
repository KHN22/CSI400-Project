const express = require('express');
const Movie = require('../models/Movie');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Public routes (ไม่ต้อง login)
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json({ movies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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