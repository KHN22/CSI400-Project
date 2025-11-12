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
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

    res.cookie('sid', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // ใช้ Secure ใน Production
      sameSite: 'None', // รองรับ Cross-Site Cookies
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
    });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('[Login] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// logout
router.post('/logout', (req, res) => {
  res.clearCookie('sid', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    path: '/',
  });
  res.status(204).send(); // ส่ง Response 204 (No Content)
});

// ตรวจสอบสถานะการล็อกอิน (frontend เรียก /api/auth/check)
router.get('/check', verifyToken, (req, res) => {
  // verifyToken จะใส่ req.user ให้ถ้าตรวจสอบผ่าน
  res.json({ user: req.user });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/profile
router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

module.exports = router;