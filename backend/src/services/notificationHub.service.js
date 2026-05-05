import pool from "../config/db.js";
import { listAudienceUserIdsForOrgBroadcast } from "./discovery.service.js";

export async function listInboxForUser(userId, { limit = 60, offset = 0 } = {}) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];
  const lim = Math.min(100, Math.max(1, Number(limit) || 60));
  const off = Math.max(0, Number(offset) || 0);
  const { rows } = await pool.query(
    `SELECT * FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [uid, lim, off]
  );
  return rows;
}

export async function markNotificationRead(userId, notificationId) {
  const uid = Number(userId);
  const nid = Number(notificationId);
  if (!Number.isFinite(uid) || !Number.isFinite(nid)) return null;
  const { rows } = await pool.query(
    `UPDATE user_notifications SET read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [nid, uid]
  );
  return rows[0] || null;
}

export async function insertBroadcastForOrg(organizationId, { title, body }) {
  const t = String(title || "").trim();
  const bStr = String(body || "").trim();
  if (!t || !bStr) return null;
  const { rows } = await pool.query(
    `INSERT INTO org_broadcasts (organization_id, title, body) VALUES ($1,$2,$3) RETURNING *`,
    [organizationId, t, bStr]
  );
  const bc = rows[0];
  if (!bc) return null;
  const audience = await listAudienceUserIdsForOrgBroadcast(organizationId);
  for (const uid of audience) {
    await pool.query(
      `INSERT INTO user_notifications (user_id, kind, title, body, metadata_json)
       VALUES ($1,'org_broadcast',$2,$3,$4)`,
      [uid, bc.title, bc.body, JSON.stringify({ organization_id: organizationId, broadcast_id: bc.id })]
    );
  }
  return { broadcast: bc, delivered_count: audience.length };
}
