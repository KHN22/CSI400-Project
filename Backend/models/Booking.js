const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  showtime: {
    type: String,
    required: true
  },
  seats: [{
    type: String,
    required: true
  }],
  ticketPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  // branch where booking was made (copied from movie or user token)
  branch: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  // refund tracking (do not reuse status for refund semantics)
  refunded: { type: Boolean, default: false },
  refunder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  refundedAt: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);