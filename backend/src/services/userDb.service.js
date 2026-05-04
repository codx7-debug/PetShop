import pool from "../config/db.js";

const TABLE = "users";

export async function createUser({ full_name, email, password, role = "user", status = "active", org_name = null, org_contact = null }) {
  const { rows } = await pool.query(
    `INSERT INTO ${TABLE} (full_name, email, password, role, status, org_name, org_contact)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [full_name, email, password, role, status, org_name, org_contact]
  );
  return rows[0];
}

export async function getUserByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE email = $1 LIMIT 1`, [email]);
  return rows[0] || null;
}

export async function listPendingOrgRequests() {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, role, status, org_name, org_contact, created_at
     FROM ${TABLE}
     WHERE role = 'org' AND status = 'pending'
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function setOrgRequestStatus(id, status) {
  const allowed = ["active", "rejected"];
  if (!allowed.includes(status)) return null;
  const { rows } = await pool.query(
    `UPDATE ${TABLE}
     SET status = $1
     WHERE id = $2 AND role = 'org' AND status = 'pending'
     RETURNING id, full_name, email, role, status, org_name, org_contact, created_at`,
    [status, id]
  );
  return rows[0] || null;
}
