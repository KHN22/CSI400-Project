const express = require('express');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// require authentication for all admin endpoints
router.use(verifyToken);

// helper: only admins allowed
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
 *     summary: Search users (admin only)
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
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let filter = {};
    if (q) {
      const re = new RegExp(q, 'i');
      filter = { $or: [{ email: re }, { username: re }] };
    }
    const users = await User.find(filter).select('_id email username role createdAt updatedAt').sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
 *                 enum: [Guest, Staff, Manager, SuperAdmin]
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
    const allowed = ['Guest', 'Staff', 'Manager', 'SuperAdmin'];
    if (!allowed.includes(role)) return res.status(400).json({ message: 'invalid role' });
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
router.patch('/users/:id/branch', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { branch } = req.body;
    if (branch && !['A','B','C'].includes(branch)) return res.status(400).json({ message: 'invalid branch' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'user not found' });

    user.branch = branch || null;
    await user.save();
    return res.json({ message: 'branch updated', user: { _id: user._id, email: user.email, username: user.username, role: user.role, branch: user.branch } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});
 *                 enum: [Guest, Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Role updated
 */
// PATCH /api/admin/users/:id/role  { role: "Guest"|"Admin" }
router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['Guest', 'Admin'].includes(role)) return res.status(400).json({ message: 'invalid role' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'user not found' });

    user.role = role;
    await user.save();
    return res.json({ message: 'role updated', user: { _id: user._id, email: user.email, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;