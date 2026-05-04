import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecretkey";

function bearerToken(req) {
  const auth = req.get("Authorization");
  const m = auth && auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function optionalAuthJwt(req, _res, next) {
  const token = bearerToken(req);
  if (!token) {
    req.auth = null;
    return next();
  }
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
  } catch {
    req.auth = null;
  }
  return next();
}

export function requireAuthJwt(req, res, next) {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <token>." });
  }
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    const uid = req.auth?.id;
    const idOk = uid === 0 || Number.isFinite(Number(uid));
    if (!idOk) {
      return res.status(401).json({ error: "Invalid token payload." });
    }
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/** Organization owner routes (approved org accounts use same JWT as login). */
export function requireOrgJwt(req, res, next) {
  return requireAuthJwt(req, res, () => {
    if (req.auth.role !== "org") {
      return res.status(403).json({ error: "Organization account required." });
    }
    return next();
  });
}
