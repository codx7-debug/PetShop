import bcrypt from "bcryptjs";
import * as userDb from "../services/userDb.service.js";

function readAdminLoginEmail() {
  const raw = process.env.ADMIN_LOGIN_EMAIL;
  const v = String(raw != null && raw !== "" ? raw : "admin").trim().toLowerCase();
  return v || "admin";
}

export async function listAccounterUsers(_req, res) {
  try {
    const rows = await userDb.listUsersByRole("accounter");
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load accountant users." });
  }
}

export async function createAccounterUser(req, res) {
  const body = req.body || {};
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const full_name = String(body.full_name || "").trim();
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Valid email required." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (!full_name) {
    return res.status(400).json({ error: "Full name required." });
  }
  if (email === readAdminLoginEmail()) {
    return res.status(400).json({ error: "This email is reserved." });
  }
  try {
    const existing = await userDb.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already in use." });
    const hashed = await bcrypt.hash(password, 10);
    const row = await userDb.createUser({
      full_name,
      email,
      password: hashed,
      role: "accounter",
      status: "active",
      org_name: null,
      org_contact: null,
    });
    res.status(201).json({
      user: { id: row.id, full_name: row.full_name, email: row.email, role: row.role, status: row.status, created_at: row.created_at },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create accountant user." });
  }
}

export async function patchAccounterUser(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  const status = String(req.body?.status || "").trim().toLowerCase();
  if (!["active", "disabled"].includes(status)) {
    return res.status(400).json({ error: 'status must be "active" or "disabled".' });
  }
  try {
    const u = await userDb.getUserById(id);
    if (!u || String(u.role || "").toLowerCase() !== "accounter") {
      return res.status(404).json({ error: "Accountant user not found." });
    }
    const row = await userDb.updateUserStatus(id, status);
    if (!row) return res.status(400).json({ error: "Could not update status." });
    res.json({ user: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update user." });
  }
}

export async function listPendingOrgRequests(_req, res) {
  try {
    const rows = await userDb.listPendingOrgRequests();
    res.json({ requests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load requests." });
  }
}

export async function approveOrgRequest(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const row = await userDb.setOrgRequestStatus(id, "active");
    if (!row) return res.status(404).json({ error: "No pending organization request with that id." });
    res.json({ user: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not approve request." });
  }
}

export async function rejectOrgRequest(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const row = await userDb.setOrgRequestStatus(id, "rejected");
    if (!row) return res.status(404).json({ error: "No pending organization request with that id." });
    res.json({ user: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reject request." });
  }
}

/** Query users by substring (mandatory query string; capped page size — no full-directory dump). */
export async function searchAccounts(req, res) {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
  if (q.length < 2) {
    return res.status(400).json({ error: "Enter at least 2 characters to search by name or email." });
  }
  try {
    const excludeEmail = readAdminLoginEmail();
    const accounts = await userDb.searchUsersForAdmin(q, { limit, excludeEmail });
    res.json({ accounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not search accounts." });
  }
}

function isReservedAdminUser(row) {
  if (!row) return true;
  if (String(row.role || "").trim().toLowerCase() === "admin") return true;
  const em = String(row.email || "")
    .trim()
    .toLowerCase();
  return em === readAdminLoginEmail();
}

export async function patchAccountStatus(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  const status = String(req.body?.status || "").trim().toLowerCase();
  if (!["active", "disabled"].includes(status)) {
    return res.status(400).json({ error: 'status must be "active" or "disabled".' });
  }
  try {
    const u = await userDb.getUserById(id);
    if (!u) return res.status(404).json({ error: "User not found." });
    if (isReservedAdminUser(u)) {
      return res.status(403).json({ error: "This account cannot be modified from the dashboard." });
    }
    const row = await userDb.updateUserStatus(id, status);
    if (!row) return res.status(400).json({ error: "Could not update status." });
    res.json({ account: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update account." });
  }
}

export async function deleteAccountAdmin(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const u = await userDb.getUserById(id);
    if (!u) return res.status(404).json({ error: "User not found." });
    if (isReservedAdminUser(u)) {
      return res.status(403).json({ error: "This account cannot be removed from the dashboard." });
    }
    const row = await userDb.deleteUserById(id);
    if (!row) return res.status(404).json({ error: "User not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove account." });
  }
}
