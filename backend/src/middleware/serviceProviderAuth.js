import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecretkey";

/**
 * Mutating clinic routes: allow legacy X-Staff-Key, or Bearer JWT for role org / admin.
 * If STAFF_API_KEY is unset, Bearer is optional (open for local dev tools).
 */
export function requireStaffOrProviderJwt(req, res, next) {
  const staffKey = process.env.STAFF_API_KEY?.trim();
  if (staffKey) {
    const sent = req.get("X-Staff-Key");
    if (sent === staffKey) return next();
  }

  const auth = req.get("Authorization");
  const m = auth && auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    if (staffKey) {
      return res.status(401).json({
        error: "Provide X-Staff-Key or sign in as an approved organization (Bearer token).",
      });
    }
    return next();
  }

  try {
    const decoded = jwt.verify(m[1], JWT_SECRET);
    if (decoded.role === "org" || decoded.role === "admin") {
      req.provider = decoded;
      return next();
    }
    return res.status(403).json({ error: "Organization or admin account required for this action." });
  } catch {
    return res.status(401).json({ error: "Invalid or expired session. Sign in again." });
  }
}
