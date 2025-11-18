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
const AuditLog = require('./models/AuditLog');
const { swaggerUi, swaggerSpec } = require('./swagger');

const app = express();

// Configure CORS to allow the frontend (including Vercel previews) and support credentials
// Default allowed client URL to the deployed frontend on Vercel. Set FRONTEND_URL
// in the Render/hosting environment to override if necessary.
const allowedOrigins = [process.env.FRONTEND_URL || 'https://csi400-project.vercel.app'];
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
  // allow common headers used by the frontend (case-insensitive)
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(express.json());
app.use(require('cookie-parser')());

// Swagger UI: allow enabling on deployed environments by setting SWAGGER_ENABLE=true
// If SWAGGER_USER and SWAGGER_PASS are set, require Basic auth to view docs.
const enableSwagger = process.env.SWAGGER_ENABLE === 'true' || process.env.NODE_ENV !== 'production';
if (enableSwagger) {
  // optional basic auth protection using SWAGGER_USER / SWAGGER_PASS
  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPass = process.env.SWAGGER_PASS;

  const swaggerAuth = (req, res, next) => {
    if (!swaggerUser || !swaggerPass) return next(); // no auth configured
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic realm="Swagger"');
      return res.status(401).send('Authentication required');
    }
    const base64 = auth.split(' ')[1] || '';
    let decoded = '';
    try { decoded = Buffer.from(base64, 'base64').toString('utf8'); } catch(e) { }
    const [u, p] = decoded.split(':');
    if (u === swaggerUser && p === swaggerPass) return next();
    res.set('WWW-Authenticate', 'Basic realm="Swagger"');
    return res.status(401).send('Invalid credentials');
  };

  app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/openapi.json', swaggerAuth, (req, res) => {
    res.json(swaggerSpec);
  });
  console.log('Swagger UI available at /api-docs');
}

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