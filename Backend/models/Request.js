const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  payload: { type: Object, default: {} },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  // approver when an admin acts on the request
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);
