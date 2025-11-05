const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const verifyToken = require('../middleware/verifyToken');

// <-- INSERT this public route BEFORE any auth middleware (so it's accessible)
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { showtime } = req.query;
    const filter = { movieId };
    if (showtime) filter.showtime = showtime;
    const bookings = await Booking.find(filter).select('seats -_id');
    const seats = bookings.flatMap(b => b.seats || []);
    return res.json({ seats });
  } catch (err) {
    console.error('[Bookings] movie seats error:', err);
    return res.status(500).json({ message: err.message });
  }
});

// All booking routes require authentication
router.use(verifyToken);

// GET /api/bookings  -> bookings for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});

// POST /api/bookings  -> create booking (body: { movieId, title, seats, showtime })
router.post('/', verifyToken, async (req, res) => {
  try {
    // เพิ่ม debug log
    console.log('[Bookings] User from token:', req.user);
    
    if (!req.user?._id) {
      console.log('[Bookings] No user ID in request');
      return res.status(401).json({ message: 'Please login first' });
    }

    const booking = new Booking({
      userId: req.user._id,
      movieId: req.body.movieId,
      showtime: req.body.showtime,
      seats: req.body.seats,
      ticketPrice: req.body.ticketPrice,
      totalPrice: req.body.totalPrice,
      status: 'pending'
    });

    console.log('[Bookings] Creating booking:', booking);
    await booking.save();
    
    res.status(201).json({ booking });
  } catch (err) {
    console.error('[Bookings] Create error:', err);
    res.status(500).json({ message: err.message });
  }
});

// (Optional) admin: GET /api/bookings/all
router.get('/all', async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'forbidden' });
    const all = await Booking.find().populate('user', 'email username role').sort({ createdAt: -1 });
    return res.json({ bookings: all });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});

// Add single booking fetch (owner or admin)
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('movieId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // allow access only to owner or admin
    const ownerId = String(booking.userId);
    const requesterId = String(req.user?._id);
    const isAdmin = req.user?.role?.toLowerCase() === 'admin';

    if (requesterId !== ownerId && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // normalize response: include movie as `movie`
    const result = booking.toObject();
    result.movie = booking.movieId || null;
    return res.json({ booking: result });
  } catch (err) {
    console.error('[Bookings] Get booking error:', err);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;