const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const express = require('express');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const COOKIE_NAME = 'token';

// register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'user already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // if ADMIN_EMAIL set in .env, that email becomes Admin on register (useful for bootstrap/testing)
    const role = (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase() === email.toLowerCase()) ? 'Admin' : 'Guest';

    const user = new User({ email, username, passwordHash, role });
    await user.save();
    return res.status(201).json({ message: 'registered' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'invalid credentials' });

    // include role in token payload
    const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error' });
  }
});

// logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.json({ message: 'logged out' });
});

// ตรวจสอบสถานะการล็อกอิน (frontend เรียก /api/auth/check)
router.get('/check', verifyToken, (req, res) => {
  // verifyToken จะใส่ req.user ให้ถ้าตรวจสอบผ่าน
  res.json({ user: req.user });
});

// Add this endpoint so frontend can GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  // verifyToken must set req.user
  res.json({ user: req.user });
});

module.exports = router;