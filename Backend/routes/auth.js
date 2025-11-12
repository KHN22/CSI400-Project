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

    res.cookie('sid', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // ใช้ Secure ใน Production
      sameSite: 'None', // รองรับ Cross-Site Cookies
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
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

// GET /api/auth/me(old)
// Add this endpoint so frontend can GET /api/auth/me
// router.get('/me', verifyToken, async (req, res) => {
//   // verifyToken must set req.user
//   const { _id } = req.user;
//   const user = await User.findOne({ _id });
//   console.log(user.profileImage);
//   console.log(req.user._id);
//   res.json({ user: req.user });
// });

router.get('/me', verifyToken, async (req, res) => {
  try {
    // req.user._id was set by verifyToken
    const { _id } = req.user;

    // Fetch full user info from database
    const user = await User.findById(_id).select('-password'); // exclude password for security

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Merge DB user with token info
    const mergedUser = {
      ...req.user,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage, // include your avatar path
      id: user._id, // normalize naming if frontend expects 'id'
    };

    res.json({ user: mergedUser });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;