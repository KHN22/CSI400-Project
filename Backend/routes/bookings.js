const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const verifyToken = require('../middleware/verifyToken');

// Normalize branch values coming from client (accept 'A'|'B'|'C' or 'Branch A' etc.)
function normalizeBranch(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (['A','B','C'].includes(upper)) return upper;
  // matches endings like 'Branch A' or 'branch-a' or similar
  const m1 = s.match(/branch\s*[:\-]?\s*([A-C])$/i);
  if (m1 && m1[1]) return m1[1].toUpperCase();
  const m2 = s.match(/([A-C])$/i);
  if (m2 && m2[1]) return m2[1].toUpperCase();
  return null;
}


// <-- public route stays public
/**
 * @openapi
 * /api/bookings/movie/{movieId}:
 *   get:
 *     tags:
 *       - bookings
 *     summary: Get booked seats for a movie (optionally filter by showtime)
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: showtime
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of booked seats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 seats:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { showtime } = req.query;
    const filter = { movieId };
    if (showtime) filter.showtime = showtime;
    // allow optional branch filter (accept 'Branch A' or 'A')
    if (req.query.branch) {
      const b = normalizeBranch(req.query.branch);
      if (b) filter.branch = b;
    }
    const bookings = await Booking.find(filter).select('seats -_id');
    const seats = bookings.flatMap(b => b.seats || []);
    return res.json({ seats });
  } catch (err) {
    console.error('[Bookings] movie seats error:', err);
    return res.status(500).json({ message: err.message });
  }
});

// <-- ENSURE all subsequent routes require authentication
router.use(verifyToken);

// GET /api/bookings  -> bookings for current user
/**
 * @openapi
 * /api/bookings:
 *   get:
 *     tags:
 *       - bookings
 *     summary: Get bookings for current user (requires auth)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User bookings
 */
router.get('/', async (req, res) => {
  try {
    // require authenticated user
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Please login first' });

    // Query bookings for the user. Exclude bookings that have been refunded.
    const bookings = await Booking.find({ userId, refunded: { $ne: true } }).sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (err) {
    console.error('[Bookings] List error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// POST /api/bookings  -> create booking (body: { movieId, title, seats, showtime })
// keep verifyToken for safety (already applied globally)
/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags:
 *       - bookings
 *     summary: Create a booking (requires auth)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movieId:
 *                 type: string
 *               showtime:
 *                 type: string
 *               seats:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post('/', async (req, res) => {
  try {
    console.log('[Bookings] User from token:', req.user);

    const uid = req.user?._id || req.user?.id;
    if (!uid) {
      console.log('[Bookings] No user ID in request');
      return res.status(401).json({ message: 'Please login first' });
    }

    // determine branch for this booking. Prefer validated client value, but fall back to user's token branch.
    const tokenBranch = normalizeBranch(req.user?.branch) || null;
    const incomingBranch = req.body.branch || null;
    const normalizedIncoming = incomingBranch ? normalizeBranch(incomingBranch) : null;
    let resolvedBranch = null;
    if (normalizedIncoming && tokenBranch && normalizedIncoming !== tokenBranch) {
      // conflict: prefer token branch (more trustworthy)
      resolvedBranch = tokenBranch;
    } else {
      resolvedBranch = normalizedIncoming || tokenBranch || null;
    }

    const booking = new Booking({
      userId: uid,
      movieId: req.body.movieId,
      showtime: req.body.showtime,
      seats: req.body.seats,
      ticketPrice: req.body.ticketPrice,
      totalPrice: req.body.totalPrice,
      branch: resolvedBranch,
      status: 'pending'
    });

    console.log('[Bookings] Creating booking:', booking);
    await booking.save();

    // create audit log for booking (BUY)
    try {
      await AuditLog.create({
        actorId: uid,
        action: 'BUY',
        movieId: booking.movieId,
        bookingId: booking._id,
        branch: booking.branch || req.user?.branch || null,
        details: { seats: booking.seats, totalPrice: booking.totalPrice }
      });
    } catch (alErr) {
      console.error('[Bookings] Failed to create audit log:', alErr);
    }

    res.status(201).json({ booking });
  } catch (err) {
    console.error('[Bookings] Create error:', err);
    res.status(500).json({ message: err.message });
  }
});

// (Optional) admin: GET /api/bookings/all
/**
 * @openapi
 * /api/bookings/all:
 *   get:
 *     tags:
 *       - bookings
 *     summary: Get all bookings (admin only)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All bookings
 */
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
/**
 * @openapi
 * /api/bookings/{id}:
 *   get:
 *     tags:
 *       - bookings
 *     summary: Get a single booking by id (owner or admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Booking object
 */
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('movieId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // allow access only to owner or admin
    const ownerId = String(booking.userId);
    const requesterId = String(req.user?._id || req.user?.id);
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