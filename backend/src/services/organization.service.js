import pool from "../config/db.js";

export async function createOrganizationForOwner(ownerUserId, data) {
  const {
    display_name,
    org_type = "vet",
    description = null,
    address_line = null,
    city = null,
    country = null,
    latitude = null,
    longitude = null,
  } = data;
  const { rows } = await pool.query(
    `INSERT INTO organizations (
       owner_user_id, display_name, org_type, description, address_line, city, country, latitude, longitude
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (owner_user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       org_type = EXCLUDED.org_type,
       description = EXCLUDED.description,
       address_line = EXCLUDED.address_line,
       city = EXCLUDED.city,
       country = EXCLUDED.country,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       updated_at = NOW()
     RETURNING *`,
    [
      ownerUserId,
      String(display_name).trim(),
      String(org_type || "vet").trim().slice(0, 40),
      description,
      address_line,
      city,
      country,
      latitude,
      longitude,
    ]
  );
  return rows[0];
}

export async function getOrganizationByOwnerUserId(ownerUserId) {
  const { rows } = await pool.query(`SELECT * FROM organizations WHERE owner_user_id = $1`, [ownerUserId]);
  return rows[0] || null;
}

export async function getOrganizationById(id) {
  const { rows } = await pool.query(`SELECT * FROM organizations WHERE id = $1`, [id]);
  return rows[0] || null;
}

/** Listed org profile (active org accounts only); null if hidden or missing. */
export async function getOrganizationPublicById(id) {
  const { rows } = await pool.query(
    `SELECT o.*
     FROM organizations o
     INNER JOIN users u ON u.id = o.owner_user_id
     WHERE o.id = $1 AND u.role = 'org' AND u.status = 'active'`,
    [id]
  );
  return rows[0] || null;
}

export async function updateOrganizationByOwner(ownerUserId, patch) {
  const fields = [];
  const vals = [];
  let i = 1;
  const map = [
    ["display_name", patch.display_name],
    ["org_type", patch.org_type],
    ["description", patch.description],
    ["address_line", patch.address_line],
    ["city", patch.city],
    ["country", patch.country],
    ["latitude", patch.latitude],
    ["longitude", patch.longitude],
  ];
  for (const [col, val] of map) {
    if (val !== undefined) {
      fields.push(`${col} = $${i++}`);
      vals.push(val);
    }
  }
  if (!fields.length) return getOrganizationByOwnerUserId(ownerUserId);
  fields.push(`updated_at = NOW()`);
  vals.push(ownerUserId);
  const { rows } = await pool.query(
    `UPDATE organizations SET ${fields.join(", ")} WHERE owner_user_id = $${i} RETURNING *`,
    vals
  );
  return rows[0] || null;
}

/**
 * Map layer: veterinary orgs with coordinates. Includes pending (unverified) and active (verified) provider accounts.
 */
export async function listVeterinaryOrganizationsForMap() {
  const { rows } = await pool.query(
    `SELECT o.id, o.display_name, o.org_type, o.latitude, o.longitude, o.city, o.country,
            o.address_line, u.status AS owner_account_status
     FROM organizations o
     INNER JOIN users u ON u.id = o.owner_user_id
     WHERE u.role = 'org'
       AND u.status IN ('active', 'pending')
       AND LOWER(TRIM(o.org_type)) = 'vet'
       AND o.latitude IS NOT NULL
       AND o.longitude IS NOT NULL
     ORDER BY (u.status = 'active') DESC, o.display_name`
  );
  return rows.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    org_type: r.org_type,
    latitude: r.latitude,
    longitude: r.longitude,
    city: r.city,
    country: r.country,
    address_line: r.address_line,
    verified: r.owner_account_status === "active",
    verification_status: r.owner_account_status === "active" ? "verified" : "pending",
  }));
}

/** Public directory: organizations whose owner account is active org. */
export async function listOrganizationsPublic({ orgType = null } = {}) {
  let q = `
    SELECT o.id, o.display_name, o.org_type, o.description, o.city, o.country, o.address_line,
           o.latitude, o.longitude, o.created_at
    FROM organizations o
    INNER JOIN users u ON u.id = o.owner_user_id
    WHERE u.role = 'org' AND u.status = 'active'
  `;
  const params = [];
  if (orgType) {
    q += ` AND o.org_type = $1`;
    params.push(orgType);
  }
  q += ` ORDER BY o.display_name`;
  const { rows } = await pool.query(q, params);
  return rows;
}
