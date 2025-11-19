const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  username: { type: String },
  profileImage: { type: String, default: '' },
  role: { type: String, enum: ['SuperAdmin', 'Manager', 'Staff', 'Guest'], default: 'Guest' },
  // branch assignment for Manager/Staff; default to 'A'
  branch: { type: String, enum: ['A', 'B', 'C'], default: 'A' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);