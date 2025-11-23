const express = require('express');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// require authentication for all admin endpoints
router.use(verifyToken);

// helper: only SuperAdmin allowed for these endpoints
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'SuperAdmin') return next();
  return res.status(403).json({ message: 'forbidden' });
}

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags:
 *       - admin
 *     summary: Search users (SuperAdmin only)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
// GET /api/admin/users?q=search
router.get('/users', verifyToken, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let filter = {};
    if (q) {
      const re = new RegExp(q, 'i');
      filter = { $or: [{ email: re }, { username: re }] };
    }

    // SuperAdmin: full list
    if (req.user && req.user.role === 'SuperAdmin') {
      const users = await User.find(filter).select('_id email username role branch createdAt updatedAt').sort({ createdAt: -1 });
      return res.json({ users });
    }

    // Manager: limited to Staff in the same branch
    if (req.user && req.user.role === 'Manager') {
      if (!req.user.branch) return res.status(403).json({ message: 'Manager has no branch' });
      // only show Staff in the manager's branch
      filter = { ...filter, role: 'Staff', branch: req.user.branch };
      const users = await User.find(filter).select('_id email username role branch createdAt updatedAt').sort({ createdAt: -1 });
      return res.json({ users });
    }

    return res.status(403).json({ message: 'forbidden' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags:
 *       - admin
 *     summary: Update a user's role (SuperAdmin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Guest, Staff, Manager, SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Role updated
 */
// PATCH /api/admin/users/:id/role  { role: "Guest"|"Staff"|"Manager"|"SuperAdmin" }
router.patch('/users/:id/role', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowed = ['Guest', 'Staff', 'Manager', 'SuperAdmin'];
    if (!allowed.includes(role)) return res.status(400).json({ message: 'invalid role' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'user not found' });

    // SuperAdmin may change any role
    if (req.user && req.user.role === 'SuperAdmin') {
      user.role = role;
      await user.save();
      return res.json({ message: 'role updated', user: { _id: user._id, email: user.email, username: user.username, role: user.role } });
    }

    // Manager may only assign 'Staff' and only for users in their branch
    if (req.user && req.user.role === 'Manager') {
      if (role !== 'Staff') return res.status(403).json({ message: 'Managers can only assign Staff role' });
      if (!req.user.branch) return res.status(403).json({ message: 'Manager has no branch' });
      if (String(user.branch) !== String(req.user.branch)) return res.status(403).json({ message: 'Managers may only manage users in their branch' });
      user.role = 'Staff';
      await user.save();
      return res.json({ message: 'role updated', user: { _id: user._id, email: user.email, username: user.username, role: user.role } });
    }

    return res.status(403).json({ message: 'forbidden' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});

/**
 * @openapi
 * /api/admin/users/{id}/branch:
 *   patch:
 *     tags:
 *       - admin
 *     summary: Assign branch to a user (SuperAdmin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch:
 *                 type: string
 *                 enum: [A, B, C]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Branch updated
 */
// PATCH /api/admin/users/:id/branch
router.patch('/users/:id/branch', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { branch } = req.body;
    if (branch && !['A','B','C'].includes(branch)) return res.status(400).json({ message: 'invalid branch' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'user not found' });

    // Only SuperAdmin can assign arbitrary branches
    if (req.user.role === 'SuperAdmin') {
      user.branch = branch || null;
      await user.save();
      return res.json({ message: 'branch updated', user: { _id: user._id, email: user.email, username: user.username, role: user.role, branch: user.branch } });
    }
    // Managers can only assign Staff to their own branch
    if (req.user.role === 'Manager') {
      if (user.role !== 'Staff') return res.status(403).json({ message: 'Managers can only assign branch to Staff'});
      if (!req.user.branch) return res.status(403).json({ message: 'Manager has no branch'});
      if (branch !== req.user.branch) return res.status(403).json({ message: 'Managers can only assign their own branch'});
      user.branch = branch;
      await user.save();
      return res.json({ message: 'branch updated', user: { _id: user._id, email: user.email, username: user.username, role: user.role, branch: user.branch } });
    }
    return res.status(403).json({ message: 'Forbidden'});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});

// mount additional admin sub-routers (auditlogs, requests, statements)
try {
  const auditlogsRouter = require('./auditlogs');
  const requestsRouter = require('./requests');
  const statementsRouter = require('./statements');
  router.use('/auditlogs', auditlogsRouter);
  router.use('/requests', requestsRouter);
  router.use('/statements', statementsRouter);
} catch (e) {
  console.error('Failed to mount admin sub-routers:', e.message);
}

module.exports = router;