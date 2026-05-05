import pool from "../config/db.js";
import { getOrganizationByOwnerUserId } from "./organization.service.js";

async function getOrgIdForOwner(ownerUserId) {
  const org = await getOrganizationByOwnerUserId(ownerUserId);
  return org?.id ?? null;
}

export async function listServicesByOrganizationId(organizationId, { activeOnly = true } = {}) {
  let q = `SELECT * FROM services WHERE organization_id = $1`;
  const params = [organizationId];
  if (activeOnly) {
    q += ` AND is_active = true`;
  }
  q += ` ORDER BY created_at DESC`;
  const { rows } = await pool.query(q, params);
  return rows;
}

export async function createService(ownerUserId, body) {
  const orgId = await getOrgIdForOwner(ownerUserId);
  if (!orgId) return null;
  const { rows } = await pool.query(
    `INSERT INTO services (organization_id, title, description, duration_minutes, price_cents, is_active)
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
  return rows[0];
}

export async function updateService(ownerUserId, serviceId, patch) {
  const orgId = await getOrgIdForOwner(ownerUserId);
  if (!orgId) return null;
  const fields = [];
  const vals = [];
  if (patch.title != null) {
    fields.push(`title = $${vals.length + 1}`);
    vals.push(String(patch.title).trim());
  }
  if (patch.description !== undefined) {
    fields.push(`description = $${vals.length + 1}`);
    vals.push(patch.description);
  }
  if (patch.duration_minutes !== undefined) {
    fields.push(`duration_minutes = $${vals.length + 1}`);
    vals.push(patch.duration_minutes);
  }
  if (patch.price_cents !== undefined) {
    fields.push(`price_cents = $${vals.length + 1}`);
    vals.push(patch.price_cents);
  }
  if (patch.is_active !== undefined) {
    fields.push(`is_active = $${vals.length + 1}`);
    vals.push(Boolean(patch.is_active));
  }
  if (!fields.length) {
    const { rows } = await pool.query(
      `SELECT * FROM services WHERE id = $1 AND organization_id = $2`,
      [serviceId, orgId]
    );
    return rows[0] || null;
  }
  fields.push(`updated_at = NOW()`);
  const idPlaceholder = vals.length + 1;
  const orgPlaceholder = vals.length + 2;
  vals.push(serviceId, orgId);
  const { rows } = await pool.query(
    `UPDATE services SET ${fields.join(", ")} WHERE id = $${idPlaceholder} AND organization_id = $${orgPlaceholder} RETURNING *`,
    vals
  );
  return rows[0] || null;
}

export async function getServiceById(serviceId) {
  const { rows } = await pool.query(`SELECT * FROM services WHERE id = $1`, [serviceId]);
  return rows[0] || null;
}

/** Active service with organization owner user id (for booking / staff assignment). */
export async function getActiveServiceWithOrgOwner(serviceId) {
  const { rows } = await pool.query(
    `SELECT s.id, s.organization_id, s.title, s.is_active,
            o.owner_user_id AS provider_user_id
     FROM services s
     INNER JOIN organizations o ON o.id = s.organization_id
     WHERE s.id = $1`,
    [serviceId]
  );
  const row = rows[0] || null;
  if (!row || !row.is_active) return null;
  return row;
}
