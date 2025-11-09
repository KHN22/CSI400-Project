const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User'); // Mongoose User model
const verifyToken = require('../middleware/verifyToken');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.use(verifyToken);

router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // store path relative to server root for frontend consumption
    const profileImagePath = `/uploads/${req.file.filename}`;

    // req.user should be populated by authenticateToken middleware.
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Update user's profileImage (Mongoose)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: profileImagePath },
      { new: true, select: '_id email role profileImage' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: updatedUser });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

module.exports = router;
