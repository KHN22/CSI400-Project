const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
// one review per user per movie
ReviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });
const Review = mongoose.model('Review', ReviewSchema);

// POST /api/reviews - create a review
router.post('/', verifyToken, async (req, res) => {
  // Reviews are disabled — ratings are sourced from TMDB and stored on Movie.tmdbId / Movie.rating
  return res.status(410).json({ message: 'Reviews disabled: use TMDB ratings' });
});

// GET /api/reviews?movieId=... - list reviews for a movie
router.get('/', async (req, res) => {
  try {
    const { movieId } = req.query;
    const filter = movieId ? { movieId } : {};
    const reviews = await Review.find(filter).populate('userId', 'email username').sort({ createdAt: -1 });
    return res.json({ reviews });
  } catch (err) {
    return res.status(500).json({ message: 'server error' });
  }
});

// GET /api/reviews/mine - list movieIds the current user has reviewed
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const uid = req.user?._id || req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Please login' });
    const rows = await Review.find({ userId: uid }).select('movieId -_id').lean();
    const movieIds = (rows || []).map(r => String(r.movieId));
    return res.json({ movieIds });
  } catch (err) {
    console.error('[Reviews] mine error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// DELETE /api/reviews/:id - delete a review (owner or admin)
router.delete('/:id', verifyToken, async (req, res) => {
  // Reviews are disabled; deletion not permitted
  return res.status(410).json({ message: 'Reviews disabled: operation not permitted' });
});

module.exports = router;
