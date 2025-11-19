const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const requireBranchAdminOrManager = require('../middleware/requireBranchAdminOrManager');
const mongoose = require('mongoose');
const RequestModel = require('../models/Request');

// load other models for refund handling
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');

// POST /api/admin/requests  create a request (user)
router.post('/', verifyToken, async (req, res) => {
  try {
    const uid = req.user?._id || req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Please login' });
    const { type, payload } = req.body;
    // attach booking branch for manager scoping when possible
    if (type === 'refund' && payload && payload.bookingId) {
      // prevent duplicate pending refund requests by same user for same booking
      const existing = await RequestModel.findOne({
        'payload.bookingId': payload.bookingId,
        type: 'refund',
        requesterId: uid,
        status: 'pending'
      });
      if (existing) return res.status(409).json({ message: 'Refund request already pending for this booking' });

      // try to copy branch from booking so managers can see requests for their branch
      try {
        const b = await Booking.findById(payload.bookingId);
        if (b && b.branch) payload.branch = payload.branch || b.branch;
      } catch (e) {
        // ignore - branch will be absent if booking not found
      }
    }

    const r = await RequestModel.create({ requesterId: uid, type, payload });
    return res.status(201).json({ request: r });
  } catch (err) {
    console.error('[Requests] Create error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// GET /api/admin/requests  (SuperAdmin: all, Manager/Staff: only their branch)
router.get('/', requireBranchAdminOrManager, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'SuperAdmin' && req.branchScope) {
      filter['payload.branch'] = req.branchScope;
    }
    const list = await RequestModel.find(filter).sort({ createdAt: -1 }).populate('requesterId', 'email username').populate('approverId', 'email username');
    return res.json({ requests: list });
  } catch (err) {
    console.error('[Requests] List error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// GET /api/admin/requests/my  list requests created by current user
router.get('/my', verifyToken, async (req, res) => {
  try {
    const uid = req.user?._id || req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Please login' });
    const list = await RequestModel.find({ requesterId: uid }).sort({ createdAt: -1 }).populate('approverId', 'email username');
    return res.json({ requests: list });
  } catch (err) {
    console.error('[Requests] my list error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// PATCH /api/admin/requests/:id  approve/reject (SuperAdmin: all, Manager/Staff: only their branch)
router.patch('/:id', requireBranchAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved','rejected','pending'].includes(status)) return res.status(400).json({ message: 'invalid status' });
    const r = await RequestModel.findById(id);
    if (!r) return res.status(404).json({ message: 'not found' });
    if (req.user.role !== 'SuperAdmin' && req.branchScope && r.payload.branch !== req.branchScope) {
      return res.status(403).json({ message: 'Forbidden: branch mismatch' });
    }
    // set new status and approver metadata
    r.status = status;
    r.approverId = req.user._id;
    r.actedAt = Date.now();
    await r.save();

    // if an admin approved a refund request, perform booking refund update and audit
    if (status === 'approved' && r.type === 'refund') {
      try {
        const bookingId = r.payload?.bookingId;
        if (bookingId) {
          const booking = await Booking.findById(bookingId);
          if (booking) {
            // set refunded flags rather than reusing status
            booking.refunded = true;
            booking.refunder = req.user._id; // admin who processed refund
            booking.refundedAt = new Date();
            await booking.save();

            // create audit log for refund
            try {
              await AuditLog.create({
                actorId: req.user._id,
                action: 'REFUND',
                bookingId: booking._id,
                movieId: booking.movieId,
                branch: r.payload?.branch || booking.branch || 'A',
                details: { requestId: r._id, requesterId: r.requesterId, reason: r.payload?.reason }
              });
            } catch (ae) {
              console.warn('Failed to create audit log for refund:', ae);
            }
          }
        }
      } catch (e) {
        console.error('Error processing refund approval:', e);
      }
    }

    return res.json({ request: r });
  } catch (err) {
    console.error('[Requests] Patch error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

// DELETE /api/admin/requests/:id  allow requester to cancel their own request
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const uid = req.user?._id || req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Please login' });
    const { id } = req.params;
    const r = await RequestModel.findById(id);
    if (!r) return res.status(404).json({ message: 'not found' });
    if (String(r.requesterId) !== String(uid)) return res.status(403).json({ message: 'Forbidden' });
    // allow cancel only when still pending
    if (r.status !== 'pending') return res.status(400).json({ message: 'Cannot cancel a non-pending request' });
    await r.remove();
    return res.json({ success: true });
  } catch (err) {
    console.error('[Requests] Delete error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
