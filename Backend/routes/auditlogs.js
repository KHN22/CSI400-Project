const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const requireAdmin = require('../middleware/requireAdmin');

// All routes here expect verifyToken to have run (admin.js mounts this)

// GET /api/admin/auditlogs?limit=50&branch=A
router.get('/', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const branch = req.query.branch;
    const filter = {};
    if (branch) filter.branch = branch;
    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(limit).populate('actorId', 'email username role');
    return res.json({ logs });
  } catch (err) {
    console.error('[AuditLogs] List error:', err);
    return res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
