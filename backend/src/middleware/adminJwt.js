import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecretkey";

export function requireAdminJwt(req, res, next) {
  const auth = req.get("Authorization");
  const m = auth && auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <token>." });
  }
  try {
    const decoded = jwt.verify(m[1], JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }
    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
