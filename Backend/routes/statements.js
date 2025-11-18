const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const requireAdmin = require('../middleware/requireAdmin');

// GET /api/admin/statements?branch=A&from=2025-01-01&to=2025-12-31
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { branch, from, to } = req.query;
    const filter = {};
    if (branch) filter.branch = branch;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    const bookings = await Booking.find(filter).lean();
    const total = bookings.reduce((s, b) => s + (b.totalPrice || 0), 0);
    const count = bookings.length;
    return res.json({ total, count, bookings });
  } catch (err) {
    console.error('[Statements] Error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
