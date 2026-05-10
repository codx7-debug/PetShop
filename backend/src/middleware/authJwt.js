import jwt from "jsonwebtoken";
import { resolveOrgIdForPortal } from "../services/organizationMember.service.js";

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

/** Blocks `accounter` JWTs from `/api/me` (pet-parent portal). Accountants may still use `/api/auth/change-password` and `/api/accounter/*`. */
export function requireAuthJwtNotAccounter(req, res, next) {
  return requireAuthJwt(req, res, () => {
    const role = String(req.auth.role || "").trim().toLowerCase();
    if (role === "accounter") {
      return res.status(403).json({
        error: "Accountant accounts are limited to the finance portal. Sign in with a different account for this feature.",
      });
    }
    return next();
  });
}

/** Organization portal: owner (`org`) or invited staff (`org_staff`). Attaches `req.organizationContext`. */
export function requireOrgJwt(req, res, next) {
  return requireAuthJwt(req, res, () => {
    const role = String(req.auth.role || "").trim().toLowerCase();
    if (!["org", "org_staff"].includes(role)) {
      return res.status(403).json({ error: "Organization account required." });
    }
    const jwtOrgRaw = req.auth.organizationId ?? req.auth.organization_id;
    const jwtOrg = jwtOrgRaw != null ? Number(jwtOrgRaw) : null;
    resolveOrgIdForPortal(Number(req.auth.id), role, Number.isFinite(jwtOrg) ? jwtOrg : null)
      .then((orgId) => {
        if (orgId == null) {
          return res.status(403).json({ error: "No organization linked to this session." });
        }
        req.organizationContext = {
          organizationId: orgId,
          userId: Number(req.auth.id),
          portalRole: role,
        };
        return next();
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: "Could not resolve organization." });
      });
  });
}
