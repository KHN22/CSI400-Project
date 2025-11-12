const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req, res, next) {
  const token = req.cookies?.sid || req.headers.authorization?.split(' ')[1];
  console.log('[verifyToken] Token:', token); // Debug token

  if (!token) {
    console.log('[verifyToken] No token found');
    return res.status(401).json({ message: 'Please login first' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    console.log('[verifyToken] Payload:', payload); // Debug payload
    req.user = payload; // เก็บข้อมูลผู้ใช้ใน req.user
    next();
  } catch (err) {
    console.error('[verifyToken] Token verification failed:', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};