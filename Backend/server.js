require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const adminRoutes = require('./routes/admin');
const bookingsRoutes = require('./routes/bookings');
const uploadsRoutes = require('./routes/uploads');
const profilesRoutes = require('./routes/profiles');

const app = express();

// Dynamically allow origins based on environment variables or patterns
const allowedOrigins = [
  process.env.CLIENT_URL, // Main frontend URL
];

// Allow Vercel preview domains (*.vercel.app)
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser requests (e.g., Postman)
  return (
    allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin) // Allow Vercel preview domains
  );
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies and Authorization header
  })
);

app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
// Support legacy/alternate client calls that expect /api/users/* (maps to same auth handlers)
app.use('/api/users', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/auth/avatar', profilesRoutes);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });