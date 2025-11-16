require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const adminRoutes = require('./routes/admin');
const bookingsRoutes = require('./routes/bookings'); // new
const uploadsRoutes = require('./routes/uploads'); // added
const changeProfiles = require('./routes/profiles');

const app = express();

// Configure CORS to allow the frontend (including Vercel previews) and support credentials
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000'];
const vercelPreviewRegex = /\.vercel\.app$/;

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (e.g., curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    if (vercelPreviewRegex.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(require('cookie-parser')());

// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// api routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/uploads', uploadsRoutes); // new
app.use('/api/auth/avatar', changeProfiles);

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});