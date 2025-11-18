module.exports = function authorizeRole(...allowedRoles) {
  return function(req, res, next) {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: 'No role found' });
    if (allowedRoles.includes(role)) return next();
    return res.status(403).json({ message: 'Forbidden' });
  }
}
