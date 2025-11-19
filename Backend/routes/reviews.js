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
const Review = mongoose.model('Review', ReviewSchema);

// POST /api/reviews - create a review
router.post('/', verifyToken, async (req, res) => {
  try {
    const { movieId, rating, comment } = req.body;
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Please login' });
    if (!movieId || !rating) return res.status(400).json({ message: 'Missing movieId or rating' });
    const review = await Review.create({ userId, movieId, rating, comment });
    // create audit log for rating
    try {
      await AuditLog.create({
        actorId: userId,
        action: 'RATE',
        movieId: movieId,
        branch: req.user?.branch || null,
        details: { rating, comment }
      });
    } catch (alErr) {
      console.error('[Reviews] Failed to create audit log for rate:', alErr);
    }
    // recompute average rating for movie and persist on Movie
    try {
      const agg = await Review.aggregate([
        { $match: { movieId: mongoose.Types.ObjectId(String(movieId)) } },
        { $group: { _id: '$movieId', avg: { $avg: '$rating' } } }
      ]);
      const avg = agg && agg[0] ? agg[0].avg : null;
      if (avg !== null) {
        // update movie.rating (store 1-5 avg)
        const Movie = require('../models/Movie');
        await Movie.findByIdAndUpdate(movieId, { rating: avg }, { new: true });
      }
    } catch (e) {
      console.warn('[Reviews] Failed to update movie average rating:', e.message || e);
    }

    return res.status(201).json({ review });
  } catch (err) {
    return res.status(500).json({ message: 'server error' });
  }
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

// DELETE /api/reviews/:id - delete a review (owner or admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: 'not found' });
    if (String(review.userId) !== String(req.user._id) && req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'forbidden' });
    }
    await review.deleteOne();
    // recompute and update movie rating after deletion
    try {
      const Movie = require('../models/Movie');
      const agg = await Review.aggregate([
        { $match: { movieId: mongoose.Types.ObjectId(String(review.movieId)) } },
        { $group: { _id: '$movieId', avg: { $avg: '$rating' } } }
      ]);
      const avg = agg && agg[0] ? agg[0].avg : 0;
      await Movie.findByIdAndUpdate(review.movieId, { rating: avg }, { new: true });
    } catch (e) {
      console.warn('[Reviews] Failed to update movie average rating after delete:', e.message || e);
    }
    return res.json({ message: 'deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
