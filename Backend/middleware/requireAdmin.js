const requireAdmin = (req, res, next) => {
  // ตรวจสอบว่ามี user object จาก verifyToken
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // ตรวจสอบ role ว่าเป็น admin (case insensitive)
  // allow SuperAdmin role (preserve compatibility with older 'Admin' if present)
  const r = (req.user.role || '').toLowerCase();
  if (r !== 'superadmin' && r !== 'admin') {
    console.log('[requireAdmin] Access denied for user:', req.user);
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

module.exports = requireAdmin;