const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const express = require('express');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const role = 'Guest';
    const user = new User({ email, username, passwordHash, role });
    await user.save();
    return res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
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

    const token = jwt.sign({ sub: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('sid', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
  res.status(204).send();
});

// ตรวจสอบสถานะการล็อกอิน
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;