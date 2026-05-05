import jwt from "jsonwebtoken";
import * as appointmentService from "../services/appointment.service.js";
import { getOrganizationByOwnerUserId } from "../services/organization.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "devsecretkey";

function staffBypass(req) {
  const key = process.env.STAFF_API_KEY?.trim();
  return Boolean(key && req.get("X-Staff-Key") === key);
}

function bearerToken(req) {
  const auth = req.get("Authorization");
  const m = auth && auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function verifyUser(req, res) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Sign in or use staff access (X-Staff-Key) for this action." });
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const uid = decoded?.id;
    const idOk = uid === 0 || Number.isFinite(Number(uid));
    if (!idOk) {
      res.status(401).json({ error: "Invalid token payload." });
      return null;
    }
    return decoded;
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
    return null;
  }
}

/**
 * Staff key, or JWT. Enforces ownership for user role on create/pet-create and mutate-by-id.
 */
export async function appointmentWriteMiddleware(req, res, next) {
  if (staffBypass(req)) {
    return next();
  }

  const decoded = verifyUser(req, res);
  if (!decoded) return;

  req.authUser = decoded;
  const path = req.path || "";
  const method = req.method;
  const role = String(decoded.role || "").trim().toLowerCase();
  const uid = Number(decoded.id);

  try {
    if (method === "POST" && path === "/appointments") {
      if (role === "user") {
        const ownerId = Number(req.body?.owner_user_id ?? req.body?.ownerUserId);
        if (!Number.isFinite(ownerId) || ownerId !== uid) {
          return res.status(403).json({ error: "You can only book for your own account." });
        }
      } else if (role === "org" || role === "org_staff" || role === "admin" || uid === 0) {
        /* org / staff may book on behalf of customers */
      } else {
        return res.status(403).json({ error: "Sign in as a user or organization to book." });
      }
      return next();
    }

    if (method === "POST" && path === "/pets") {
      if (role === "user") {
        const ownerId = Number(req.body?.owner_user_id ?? req.body?.ownerUserId);
        if (!Number.isFinite(ownerId) || ownerId !== uid) {
          return res.status(403).json({ error: "You can only add pets to your own account." });
        }
      } else if (role === "org" || role === "org_staff" || role === "admin" || uid === 0) {
        /* staff / org adding pet for a customer */
      } else {
        return res.status(403).json({ error: "Not allowed." });
      }
      return next();
    }

    if (method === "POST" && path === "/holidays") {
      if (role === "org" || role === "org_staff" || role === "admin" || uid === 0) {
        return next();
      }
      return res.status(403).json({ error: "Organization or admin required." });
    }

    if (method === "POST" && path === "/appointments/waitlist") {
      if (role !== "user") {
        return res.status(403).json({ error: "Only signed-in pet owners may join waitlists." });
      }
      const ownerId = Number(req.body?.owner_user_id ?? req.body?.ownerUserId);
      if (!Number.isFinite(ownerId) || ownerId !== uid) {
        return res.status(403).json({ error: "You can only add yourself to a waitlist." });
      }
      return next();
    }

    const patchAppt = method === "PATCH" && path.startsWith("/appointments/");
    const cancelAppt = method === "POST" && path.includes("/appointments/") && path.endsWith("/cancel");
    if (patchAppt || cancelAppt) {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid appointment id." });
      }
      const row = await appointmentService.getAppointmentById(id);
      if (!row) {
        return res.status(404).json({ error: "Appointment not found." });
      }
      if (role === "admin" || uid === 0) {
        return next();
      }
      if (role === "user" && Number(row.owner_user_id) === uid) {
        return next();
      }
      const apptOrgId = await appointmentService.getAppointmentServiceOrganizationId(row);
      if (
        role === "org_staff" &&
        Number.isFinite(Number(decoded.organizationId)) &&
        apptOrgId != null &&
        Number(decoded.organizationId) === apptOrgId
      ) {
        return next();
      }
      if (role === "org") {
        const ownerOrg = await getOrganizationByOwnerUserId(uid);
        if (ownerOrg && apptOrgId != null && Number(ownerOrg.id) === Number(apptOrgId)) {
          return next();
        }
        if (Number(row.clinic_staff_user_id) === uid) {
          return next();
        }
      }
      return res.status(403).json({ error: "Not allowed to change this appointment." });
    }

    return res.status(500).json({ error: "Auth middleware configuration error." });
  } catch (e) {
    return next(e);
  }
}

/** List pets for owner: staff bypass, or JWT with access to that owner id. */
export function petsByOwnerListMiddleware(req, res, next) {
  if (staffBypass(req)) {
    return next();
  }
  const decoded = verifyUser(req, res);
  if (!decoded) return;
  req.authUser = decoded;
  const role = String(decoded.role || "").trim().toLowerCase();
  const uid = Number(decoded.id);
  const ownerParam = Number.parseInt(req.params.ownerUserId, 10);
  if (!Number.isFinite(ownerParam)) {
    return res.status(400).json({ error: "Invalid owner id." });
  }
  if (role === "admin" || uid === 0) {
    return next();
  }
  if (role === "org" || role === "org_staff") {
    return next();
  }
  if (role === "user" && ownerParam === uid) {
    return next();
  }
  return res.status(403).json({ error: "You can only view your own pets." });
}
