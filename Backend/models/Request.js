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

// Prevent duplicate pending refund requests for same booking + requester at DB level
requestSchema.index({ 'payload.bookingId': 1, type: 1, requesterId: 1, status: 1 }, { unique: true, partialFilterExpression: { type: 'refund', status: 'pending' } });

module.exports = mongoose.model('Request', requestSchema);
