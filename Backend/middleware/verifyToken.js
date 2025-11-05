const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // map payload fields -> req.user
    req.user = {
      _id: decoded.sub || decoded._id || decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;