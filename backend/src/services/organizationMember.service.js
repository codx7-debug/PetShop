import pool from "../config/db.js";
import { getOrganizationByOwnerUserId } from "./organization.service.js";

export async function getMembership(orgId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [orgId, userId]
  );
  return rows[0] || null;
}

/** First org membership for staff accounts (one org per staff in MVP). */
export async function getMembershipByStaffUserId(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM organization_members WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function listMembersWithUsers(organizationId) {
  const { rows } = await pool.query(
    `SELECT m.organization_id, m.user_id, m.role_in_org, m.created_at,
            u.full_name, u.email
     FROM organization_members m
     INNER JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = $1
     ORDER BY m.created_at ASC`,
    [organizationId]
  );
  return rows;
}

export async function addMember(organizationId, { userId, role_in_org }) {
  const { rows } = await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, role_in_org)
     VALUES ($1,$2,$3)
     ON CONFLICT (organization_id, user_id) DO UPDATE SET role_in_org = EXCLUDED.role_in_org
     RETURNING *`,
    [organizationId, userId, String(role_in_org || "staff").trim().slice(0, 32) || "staff"]
  );
  return rows[0] || null;
}

export async function removeMember(organizationId, memberUserId) {
  await pool.query(
    `DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [organizationId, memberUserId]
  );
}

/** Owner user id plus all linked staff user ids. */
export async function listBookableStaffUserIds(organizationId, ownerUserId) {
  const ids = new Set();
  if (ownerUserId != null) ids.add(Number(ownerUserId));
  const { rows } = await pool.query(`SELECT user_id FROM organization_members WHERE organization_id = $1`, [
    organizationId,
  ]);
  for (const r of rows) ids.add(Number(r.user_id));
  return [...ids].filter(Number.isFinite);
}

export async function isUserBookableForOrg(userId, organizationId, ownerUserId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return false;
  if (ownerUserId != null && Number(ownerUserId) === uid) return true;
  const m = await getMembership(organizationId, uid);
  return Boolean(m);
}

/** Resolve portal org id from JWT-ish context: explicit org owner or staff membership. */
export async function resolveOrgIdForPortal(userId, role, jwtOrganizationId) {
  const r = String(role || "").toLowerCase();
  if (r === "org") {
    const o = await getOrganizationByOwnerUserId(userId);
    return o?.id ?? null;
  }
  if (r === "org_staff") {
    const n = Number(jwtOrganizationId);
    if (Number.isFinite(n)) {
      const m = await getMembership(n, userId);
      return m ? n : null;
    }
    const m = await getMembershipByStaffUserId(userId);
    return m?.organization_id ?? null;
  }
  return null;
}
