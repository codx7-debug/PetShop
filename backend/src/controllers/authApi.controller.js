import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userDb from "../services/userDb.service.js";
import { createOrganizationForOwner, getOrganizationByOwnerUserId } from "../services/organization.service.js";

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
function shapePublicUser(row, orgProfile = null) {
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
  };
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
    const safeRole = role === "org" ? "org" : "user";

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
    if (user.role === "org") {
      orgRow = await getOrganizationByOwnerUserId(user.id);
    }
    const publicUser = shapePublicUser(user, orgRow);
    const payload = { id: publicUser.id, role: publicUser.role, email: publicUser.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
    return res.json({
      token,
      user: publicUser,
      service_provider: publicUser.role === "org",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}
