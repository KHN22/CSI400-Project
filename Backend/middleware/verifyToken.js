const jwt = require("jsonwebtoken");

module.exports = function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies?.sid;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = payload; // Attach user info to request

    // If client requested verification + redirect instruction (e.g. /api/auth/me?redirect=1),
    // return a small JSON object so client can navigate. This avoids server-side HTML redirects from API middleware.
    if (req.query && (req.query.redirect === "1" || req.query.redirect === "true")) {
      const clientUrl = process.env.CLIENT_URL || "/";
      return res.status(200).json({ ok: true, redirect: clientUrl });
    }

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};