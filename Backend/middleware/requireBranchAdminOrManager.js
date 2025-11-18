// Allows SuperAdmin, or Manager/Staff for their own branch
module.exports = function requireBranchAdminOrManager(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const role = (req.user.role || '').toLowerCase();
  if (role === 'superadmin') return next();
  if ((role === 'manager' || role === 'staff') && req.user.branch) {
    req.branchScope = req.user.branch;
    return next();
  }
  return res.status(403).json({ message: 'Branch admin/manager access required' });
};
