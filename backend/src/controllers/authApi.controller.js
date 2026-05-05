import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userDb from "../services/userDb.service.js";
import {
  createOrganizationForOwner,
  getOrganizationByOwnerUserId,
  getOrganizationById,
} from "../services/organization.service.js";
import { getMembershipByStaffUserId } from "../services/organizationMember.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "devsecretkey";

/** Built-in dashboard login (override with ADMIN_LOGIN_EMAIL / ADMIN_LOGIN_PASSWORD in .env). */
function readAdminLoginEmail() {
  const raw = process.env.ADMIN_LOGIN_EMAIL;
  const v = String(raw != null && raw !== "" ? raw : "admin").trim().toLowerCase();
  return v || "admin";
}
function readAdminLoginPassword() {
  const raw = process.env.ADMIN_LOGIN_PASSWORD;
  const v = String(raw != null && raw !== "" ? raw : "admin").trim();
  return v || "admin";
}

/** Stable JSON shape for clients (always includes `role`). */
export function shapePublicUser(row, orgProfile = null, orgMemberRow = null) {
  if (!row) return null;
  const base = {
    id: row.id,
    email: row.email,
    role: String(row.role ?? "user").trim().toLowerCase(),
    full_name: row.full_name ?? null,
    status: String(row.status ?? "active").trim().toLowerCase(),
    org_name: row.org_name ?? null,
    org_contact: row.org_contact ?? null,
    created_at: row.created_at ?? null,
    phone: row.phone ?? null,
    date_of_birth: row.date_of_birth ?? null,
    address_line: row.address_line ?? null,
    address_city: row.address_city ?? null,
    address_region: row.address_region ?? null,
    address_postal: row.address_postal ?? null,
    address_country: row.address_country ?? null,
    notify_email: row.notify_email !== false,
    notify_push: row.notify_push !== false,
    notify_marketing: Boolean(row.notify_marketing),
    notify_booking_reminder: row.notify_booking_reminder !== false,
    notify_org_broadcast: row.notify_org_broadcast !== false,
  };
  if (orgMemberRow && base.role === "org_staff") {
    return {
      ...base,
      org_type: orgProfile?.org_type ?? null,
      organization_id: orgMemberRow.organization_id ?? null,
      org_member_role: orgMemberRow.role_in_org ?? null,
    };
  }
  if (orgProfile && base.role === "org") {
    return {
      ...base,
      org_type: orgProfile.org_type ?? null,
      organization_id: orgProfile.id ?? null,
    };
  }
  return base;
}

function validateRegisterInput({ full_name, email, password, role, org_name, org_contact }) {
  if (!email || !/\S+@\S+\.\S+/.test(email)) return "Valid email is required.";
  if (!password || password.length < 6) return "Password must be at least 6 characters.";
  if (role === "org") {
    if (!org_name || !org_name.trim()) return "Organization name is required.";
    if (!org_contact || !org_contact.trim()) return "Organization contact name is required.";
  } else if (!full_name || !full_name.trim()) {
    return "Full name is required.";
  }
  return null;
}

function validateLoginInput({ email, password }) {
  if (!String(email ?? "").trim() || !String(password ?? "").trim()) {
    return "Email and password are required.";
  }
  return null;
}

export async function register(req, res) {
  try {
    const { full_name, email, password, role, org_name, org_contact } = req.body;
    let safeRole = role === "org" ? "org" : "user";
    if (String(role || "").trim().toLowerCase() === "org_staff") {
      return res.status(400).json({ message: "Organization staff accounts are created by your organization admin." });
    }

    const validationError = validateRegisterInput({ full_name, email, password, role: safeRole, org_name, org_contact });
    if (validationError) return res.status(400).json({ message: validationError });

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === readAdminLoginEmail()) {
      return res.status(400).json({ message: "This login is reserved for the system administrator." });
    }
    const existingUser = await userDb.getUserByEmail(normalizedEmail);
    if (existingUser) return res.status(409).json({ message: "This email is already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userToCreate = {
      full_name: safeRole === "org" ? (org_contact || "").trim() : full_name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: safeRole,
      status: safeRole === "org" ? "pending" : "active",
      org_name: safeRole === "org" ? (org_name || "").trim() : null,
      org_contact: safeRole === "org" ? (org_contact || "").trim() : null,
    };

    const newUser = await userDb.createUser(userToCreate);

    if (safeRole === "org") {
      try {
        await createOrganizationForOwner(newUser.id, {
          display_name: (org_name || "").trim(),
          org_type: String(req.body.org_type || "vet").trim().slice(0, 40),
          description: req.body.org_description ?? null,
          address_line: req.body.address_line ?? null,
          city: req.body.city ?? null,
          country: req.body.country ?? null,
          latitude: req.body.latitude != null ? Number(req.body.latitude) : null,
          longitude: req.body.longitude != null ? Number(req.body.longitude) : null,
        });
      } catch (orgErr) {
        console.error("Organization profile creation failed:", orgErr);
      }
    }

    let orgRow = null;
    if (safeRole === "org") {
      orgRow = await getOrganizationByOwnerUserId(newUser.id);
    }
    return res.status(201).json({ user: shapePublicUser(newUser, orgRow) });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function changePassword(req, res) {
  const uid = req.auth?.id;
  if (uid == null || uid === 0) {
    return res.status(403).json({ message: "Password change is not available for this account." });
  }
  const { old_password, new_password } = req.body || {};
  const oldStr = String(old_password ?? "");
  const newStr = String(new_password ?? "");
  if (!oldStr || !newStr) {
    return res.status(400).json({ message: "Old password and new password are required." });
  }
  if (newStr.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }
  try {
    const user = await userDb.getUserById(uid);
    if (!user) return res.status(404).json({ message: "User not found." });
    const ok = await bcrypt.compare(oldStr, user.password);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect." });
    const hashed = await bcrypt.hash(newStr, 10);
    await userDb.updateUserPassword(uid, hashed);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not update password." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const validationError = validateLoginInput({ email, password });
    if (validationError) return res.status(400).json({ message: validationError });

    const normalizedEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    const passwordStr = String(password ?? "");
    const adminEmail = readAdminLoginEmail();
    const adminPassword = readAdminLoginPassword();

    if (normalizedEmail === adminEmail && passwordStr.trim() === adminPassword) {
      const token = jwt.sign({ id: 0, role: "admin", email: adminEmail }, JWT_SECRET, { expiresIn: "12h" });
      return res.json({
        token,
        user: {
          id: 0,
          email: adminEmail,
          role: "admin",
          full_name: "Administrator",
          status: "active",
        },
        service_provider: false,
      });
    }

    const user = await userDb.getUserByEmail(normalizedEmail);
    if (!user) return res.status(400).json({ message: "Invalid email or password." });

    const passwordMatch = await bcrypt.compare(passwordStr, user.password);
    if (!passwordMatch) return res.status(400).json({ message: "Invalid email or password." });

    if (user.role === "org" && user.status === "pending") {
      return res.status(403).json({
        message: "Your organization account is pending approval. You will be notified once approved.",
        code: "ORG_PENDING",
      });
    }

    if (user.status === "rejected" || user.status === "disabled") {
      return res.status(403).json({
        message: "This account has been disabled. Please contact support.",
        code: "ACCOUNT_DISABLED",
      });
    }

    let orgRow = null;
    let orgMember = null;
    if (user.role === "org") {
      orgRow = await getOrganizationByOwnerUserId(user.id);
    } else if (user.role === "org_staff") {
      orgMember = await getMembershipByStaffUserId(user.id);
      orgRow = orgMember ? await getOrganizationById(orgMember.organization_id) : null;
    }

    if (user.role === "org_staff" && (!orgMember || !orgRow)) {
      return res.status(403).json({
        message: "This staff login is not linked to an organization.",
        code: "ORG_STAFF_ORPHAN",
      });
    }

    const publicUser = shapePublicUser(user, orgRow, orgMember);
    const payload = { id: publicUser.id, role: publicUser.role, email: publicUser.email };
    if (user.role === "org" && orgRow?.id != null) payload.organizationId = orgRow.id;
    if (user.role === "org_staff" && orgMember?.organization_id != null) {
      payload.organizationId = orgMember.organization_id;
      payload.orgMemberRole = orgMember.role_in_org;
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
    return res.json({
      token,
      user: publicUser,
      service_provider: publicUser.role === "org" || publicUser.role === "org_staff",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}
