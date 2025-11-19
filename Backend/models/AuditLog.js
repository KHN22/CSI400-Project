const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['BUY','REFUND','ADD_MOVIE','EDIT_MOVIE','RATE'], required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  branch: { type: String, enum: ['A','B','C'], default: 'A' },
  details: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
