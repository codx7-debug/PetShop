// User Service: Queries for user-related DB operations

const { userTableName } = require('../model/user.model');
const db = require('../config/db'); // ✅ Import the shared DB pool

// ─── Create User ──────────────────────────────────────────────────────────────
async function createUser({
  full_name,
  email,
  password,
  role = 'user',
  status = 'active', // ✅ 'active' for users, 'pending' for orgs
  org_name = null,
  org_contact = null,
}) {
  const query = `
    INSERT INTO ${userTableName}
      (full_name, email, password, role, status, org_name, org_contact)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const values = [full_name, email, password, role, status, org_name, org_contact];
  const result = await db.query(query, values);
  return result.rows[0];
}

// ─── Get User by Email ────────────────────────────────────────────────────────
async function getUserByEmail(email) {
  const query = `SELECT * FROM ${userTableName} WHERE email = $1 LIMIT 1;`;
  const result = await db.query(query, [email]);
  return result.rows[0] || null; // ✅ Explicit null instead of undefined
}

// ─── Get User by ID ───────────────────────────────────────────────────────────
async function getUserById(id) {
  const query = `SELECT * FROM ${userTableName} WHERE id = $1 LIMIT 1;`;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
}

// ─── Get All Users (optionally filtered by role) ──────────────────────────────
async function getAllUsers(role = null) {
  let query = `SELECT * FROM ${userTableName}`;
  const values = [];
  if (role) {
    query += ` WHERE role = $1`;
    values.push(role);
  }
  query += ` ORDER BY created_at DESC`;
  const result = await db.query(query, values);
  return result.rows;
}

// ─── Update Password ──────────────────────────────────────────────────────────
async function updateUserPassword(userId, newHashedPassword) {
  const query = `
    UPDATE ${userTableName}
    SET password = $1
    WHERE id = $2
    RETURNING *;
  `;
  const result = await db.query(query, [newHashedPassword, userId]);
  return result.rows[0] || null;
}

// ─── Update Status (for org approval/rejection) ───────────────────────────────
async function updateUserStatus(userId, status) {
  const allowed = ['active', 'pending', 'rejected', 'disabled'];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const query = `
    UPDATE ${userTableName}
    SET status = $1
    WHERE id = $2
    RETURNING *;
  `;
  const result = await db.query(query, [status, userId]);
  return result.rows[0] || null;
}

// ─── Delete User ──────────────────────────────────────────────────────────────
async function deleteUserById(id) {
  const query = `DELETE FROM ${userTableName} WHERE id = $1 RETURNING *;`;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getAllUsers,
  updateUserPassword,
  updateUserStatus,
  deleteUserById,
};