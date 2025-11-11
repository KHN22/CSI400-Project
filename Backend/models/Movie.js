const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  year: { type: Number },
  poster: { type: String, default: '' },
  description: { type: String, default: '' },
  // showtimes simple ISO strings or friendly text (we treat as strings for flexibility)
  showtimes: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ticketPrice: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  rating: { type: Number, min: 0, max: 10, default: 0 },
  length: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);