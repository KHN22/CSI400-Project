// Allows SuperAdmin or users whose token branch matches targetBranch
module.exports = function authorizeBranchOrGlobal(getTargetBranch) {
  return function(req, res, next) {
    // getTargetBranch can be a function(req) or a string
    let target = typeof getTargetBranch === 'function' ? getTargetBranch(req) : getTargetBranch;
    const role = req.user?.role;
    const userBranch = req.user?.branch || null;

    if (!role) return res.status(401).json({ message: 'No role found' });

    // SuperAdmin bypasses branch checks
    if (role === 'SuperAdmin') return next();

    // If user's branch matches target branch, allow
    if (userBranch && target && String(userBranch) === String(target)) return next();

    return res.status(403).json({ message: 'Forbidden: branch mismatch' });
  }
}
