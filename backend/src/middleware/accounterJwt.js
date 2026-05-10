import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecretkey";

/** Read-only finance views: organization accountant, or full admin (impersonation-style). */
export function requireAccounterOrAdminJwt(req, res, next) {
  const auth = req.get("Authorization");
  const m = auth && auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <token>." });
  }
  try {
    const decoded = jwt.verify(m[1], JWT_SECRET);
    const role = String(decoded.role || "").trim().toLowerCase();
    if (role !== "accounter" && role !== "admin") {
      return res.status(403).json({ error: "Accountant or admin access required." });
    }
    req.financeViewer = { role, userId: decoded.id, email: decoded.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
