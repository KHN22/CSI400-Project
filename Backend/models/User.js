const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  username: { type: String },
  profileImage: { type: String, default: null }, // NEW: stores profile picture path or URL
  role: { type: String, enum: ['Guest', 'Admin'], default: 'Guest' }// new
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);