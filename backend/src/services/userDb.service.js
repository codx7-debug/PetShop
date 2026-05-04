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

export async function getUserById(id) {
  const uid = Number(id);
  if (!Number.isFinite(uid) || uid <= 0) return null;
  const { rows } = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1 LIMIT 1`, [uid]);
  return rows[0] || null;
}

export async function updateUserPassword(userId, hashedPassword) {
  const { rows } = await pool.query(
    `UPDATE ${TABLE} SET password = $1 WHERE id = $2 RETURNING id`,
    [hashedPassword, userId]
  );
  return rows[0] || null;
}

const PROFILE_FIELDS = [
  "full_name",
  "phone",
  "date_of_birth",
  "address_line",
  "address_city",
  "address_region",
  "address_postal",
  "address_country",
  "notify_email",
  "notify_push",
  "notify_marketing",
];

export async function updateUserProfile(userId, patch) {
  const fields = [];
  const vals = [];
  let i = 1;
  for (const col of PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(patch, col)) {
      let v = patch[col];
      if (col === "date_of_birth") {
        v = v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, 32);
      } else if (col.startsWith("notify_")) {
        v = Boolean(v);
      } else if (typeof v === "string") {
        v = v.trim() || null;
      }
      fields.push(`${col} = $${i++}`);
      vals.push(v);
    }
  }
  if (!fields.length) return getUserById(userId);
  vals.push(userId);
  const { rows } = await pool.query(
    `UPDATE ${TABLE} SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    vals
  );
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
