const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Statement = require('../models/Statement');
const requireAdmin = require('../middleware/requireAdmin');
const requireBranchAdminOrManager = require('../middleware/requireBranchAdminOrManager');

// GET /api/admin/statements?branch=A&from=2025-01-01&to=2025-12-31
// GET /api/admin/statements?branch=A&from=2025-01-01&to=2025-12-31
router.get('/', requireBranchAdminOrManager, async (req, res) => {
  try {
    const { branch, from, to } = req.query;
    const filter = {};
    // SuperAdmin: can query any branch; Manager/Staff: only their branch
    if (req.user.role !== 'SuperAdmin' && req.branchScope) {
      filter.branch = req.branchScope;
    } else if (branch) {
      filter.branch = branch;
    }
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    const bookings = await Booking.find(filter).lean();
    const refundedBookings = bookings.filter(b => b.refunded);
    const salesBookings = bookings.filter(b => !b.refunded);
    const totalSales = salesBookings.reduce((s, b) => s + (b.totalPrice || 0), 0);
    const totalRefunds = refundedBookings.reduce((s, b) => s + (b.totalPrice || 0), 0);
    const net = totalSales - totalRefunds;

    // persist statement record for audit/reporting
    try {
      const stmt = await Statement.create({
        branch: filter.branch || null,
        from: from ? new Date(from) : null,
        to: to ? new Date(to) : null,
        totalSales,
        totalRefunds,
        net,
        bookingsCount: bookings.length,
        salesCount: salesBookings.length,
        refundedCount: refundedBookings.length,
        generatedBy: req.user?._id || null,
        meta: { query: { branch: filter.branch || null, from, to } }
      });
      return res.json({
        totalSales,
        totalRefunds,
        net,
        bookingsCount: bookings.length,
        salesCount: salesBookings.length,
        refundedCount: refundedBookings.length,
        bookings,
        statement: stmt
      });
    } catch (e) {
      console.warn('[Statements] failed to persist statement:', e);
      return res.json({
        totalSales,
        totalRefunds,
        net,
        bookingsCount: bookings.length,
        salesCount: salesBookings.length,
        refundedCount: refundedBookings.length,
        bookings
      });
    }
  } catch (err) {
    console.error('[Statements] Error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
