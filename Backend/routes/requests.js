const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const requireBranchAdminOrManager = require('../middleware/requireBranchAdminOrManager');
const mongoose = require('mongoose');

// Simple Request model stored inline to avoid adding another model file for now
const RequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  payload: { type: Object, default: {} },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const RequestModel = mongoose.model('Request', RequestSchema);

// POST /api/admin/requests  create a request (user)
router.post('/', verifyToken, async (req, res) => {
  try {
    const uid = req.user?._id || req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Please login' });
    const { type, payload } = req.body;
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
    const list = await RequestModel.find(filter).sort({ createdAt: -1 }).populate('requesterId', 'email username');
    return res.json({ requests: list });
  } catch (err) {
    console.error('[Requests] List error:', err);
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
    r.status = status;
    await r.save();
    return res.json({ request: r });
  } catch (err) {
    console.error('[Requests] Patch error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
