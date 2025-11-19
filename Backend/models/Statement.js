const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema({
  branch: { type: String, enum: ['A','B','C'], default: 'A' },
  from: { type: Date },
  to: { type: Date },
  totalSales: { type: Number, default: 0 },
  totalRefunds: { type: Number, default: 0 },
  net: { type: Number, default: 0 },
  bookingsCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  refundedCount: { type: Number, default: 0 },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  meta: { type: Object, default: {} }
});

module.exports = mongoose.model('Statement', statementSchema);
