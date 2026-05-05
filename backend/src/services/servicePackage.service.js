import pool from "../config/db.js";

export async function resolveOrgIdFromOwnerUserId(ownerUserId) {
  const { rows } = await pool.query(`SELECT id FROM organizations WHERE owner_user_id = $1`, [ownerUserId]);
  return rows[0]?.id ?? null;
}

export async function listPackagesByOrganizationId(organizationId, { activeOnly = true } = {}) {
  let q = `SELECT * FROM service_packages WHERE organization_id = $1`;
  const p = [organizationId];
  if (activeOnly) q += ` AND is_active = true`;
  q += ` ORDER BY created_at DESC`;
  const { rows } = await pool.query(q, p);
  return rows;
}

export async function listPackageItems(packageId) {
  const { rows } = await pool.query(
    `SELECT i.*, s.title AS service_title, s.duration_minutes, s.price_cents
     FROM service_package_items i
     INNER JOIN services s ON s.id = i.service_id
     WHERE i.package_id = $1`,
    [packageId]
  );
  return rows;
}

/** Public bookable package: active, belongs to org, with derived duration. */
export async function getBookablePackage(packageId) {
  const { rows } = await pool.query(`SELECT * FROM service_packages WHERE id = $1 AND is_active = true`, [
    packageId,
  ]);
  const pkg = rows[0] || null;
  if (!pkg) return null;
  const items = await listPackageItems(packageId);
  let duration = pkg.duration_minutes != null ? Number(pkg.duration_minutes) : null;
  if ((duration == null || !Number.isFinite(duration)) && items.length) {
    duration = items.reduce((acc, it) => acc + Number(it.duration_minutes || 0) * Number(it.quantity || 1), 0);
  }
  if (!Number.isFinite(duration) || duration <= 0) duration = 60;
  return { ...pkg, items, duration_minutes: duration };
}

export async function createPackage(ownerUserId, body) {
  const orgId = await resolveOrgIdFromOwnerUserId(ownerUserId);
  if (!orgId) return null;
  const { rows } = await pool.query(
    `INSERT INTO service_packages (organization_id, title, description, duration_minutes, price_cents, is_active)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      orgId,
      String(body.title || "").trim(),
      body.description?.trim() || null,
      body.duration_minutes != null ? Number(body.duration_minutes) : null,
      body.price_cents != null ? Number(body.price_cents) : null,
      body.is_active !== false,
    ]
  );
  return rows[0] || null;
}

export async function updatePackage(ownerUserId, packageId, patch) {
  const orgId = await resolveOrgIdFromOwnerUserId(ownerUserId);
  if (!orgId) return null;
  const fields = [];
  const vals = [];
  let i = 1;
  for (const [col, val] of [
    ["title", patch.title],
    ["description", patch.description],
    ["duration_minutes", patch.duration_minutes],
    ["price_cents", patch.price_cents],
    ["is_active", patch.is_active],
  ]) {
    if (val !== undefined) {
      fields.push(`${col} = $${i++}`);
      vals.push(val);
    }
  }
  if (!fields.length) {
    const { rows } = await pool.query(`SELECT * FROM service_packages WHERE id = $1 AND organization_id = $2`, [
      packageId,
      orgId,
    ]);
    return rows[0] || null;
  }
  fields.push(`updated_at = NOW()`);
  vals.push(packageId, orgId);
  const idPh = vals.length - 1;
  const orgPh = vals.length;
  const { rows } = await pool.query(
    `UPDATE service_packages SET ${fields.join(", ")} WHERE id = $${idPh} AND organization_id = $${orgPh} RETURNING *`,
    vals
  );
  return rows[0] || null;
}

export async function setPackageItems(ownerUserId, packageId, pairs) {
  const orgId = await resolveOrgIdFromOwnerUserId(ownerUserId);
  if (!orgId) return null;
  const { rows: own } = await pool.query(`SELECT id FROM service_packages WHERE id = $1 AND organization_id = $2`, [
    packageId,
    orgId,
  ]);
  if (!own[0]) return null;
  await pool.query(`DELETE FROM service_package_items WHERE package_id = $1`, [packageId]);
  for (const row of pairs || []) {
    const sid = Number(row.service_id ?? row.serviceId);
    const qty = Math.max(1, Number(row.quantity) || 1);
    if (!Number.isFinite(sid)) continue;
    const { rows: sv } = await pool.query(`SELECT id FROM services WHERE id = $1 AND organization_id = $2`, [
      sid,
      orgId,
    ]);
    if (!sv[0]) continue;
    await pool.query(`INSERT INTO service_package_items (package_id, service_id, quantity) VALUES ($1,$2,$3)`, [
      packageId,
      sid,
      qty,
    ]);
  }
  return getBookablePackage(packageId);
}
