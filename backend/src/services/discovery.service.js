import pool from "../config/db.js";

function parsePhotoUrls(raw) {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function recordRecentOrganizationView(userId, organizationId) {
  const uid = Number(userId);
  const oid = Number(organizationId);
  if (!Number.isFinite(uid) || !Number.isFinite(oid)) return false;
  await pool.query(
    `INSERT INTO user_org_recent (user_id, organization_id, viewed_at)
     VALUES ($1,$2,NOW())
     ON CONFLICT (user_id, organization_id) DO UPDATE SET viewed_at = NOW()`,
    [uid, oid]
  );
  return true;
}

export async function setFavoriteOrganization(userId, organizationId, on) {
  const uid = Number(userId);
  const oid = Number(organizationId);
  if (!Number.isFinite(uid) || !Number.isFinite(oid)) return null;
  if (on) {
    await pool.query(
      `INSERT INTO user_org_favorites (user_id, organization_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [uid, oid]
    );
  } else {
    await pool.query(`DELETE FROM user_org_favorites WHERE user_id = $1 AND organization_id = $2`, [uid, oid]);
  }
  return { ok: true, favorited: on };
}

export async function listFavoriteOrgIds(userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];
  const { rows } = await pool.query(
    `SELECT organization_id FROM user_org_favorites WHERE user_id = $1 ORDER BY created_at DESC`,
    [uid]
  );
  return rows.map((r) => Number(r.organization_id)).filter(Number.isFinite);
}

export async function listFavoriteOrganizations(userId, { limit = 24 } = {}) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];
  const lim = Math.min(48, Math.max(1, Number(limit) || 24));
  const { rows } = await pool.query(
    `SELECT o.id, o.display_name, o.org_type, f.created_at
     FROM user_org_favorites f
     INNER JOIN organizations o ON o.id = f.organization_id
     INNER JOIN users u ON u.id = o.owner_user_id
     WHERE f.user_id = $1 AND u.role = 'org' AND u.status = 'active'
     ORDER BY f.created_at DESC
     LIMIT ${lim}`,
    [uid]
  );
  return rows;
}

export async function listRecentOrganizations(userId, { limit = 12 } = {}) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];
  const lim = Math.min(48, Math.max(1, Number(limit) || 12));
  const { rows } = await pool.query(
    `SELECT o.id, o.display_name, o.org_type, r.viewed_at
     FROM user_org_recent r
     INNER JOIN organizations o ON o.id = r.organization_id
     INNER JOIN users u ON u.id = o.owner_user_id
     WHERE r.user_id = $1 AND u.role = 'org' AND u.status = 'active'
     ORDER BY r.viewed_at DESC
     LIMIT ${lim}`,
    [uid]
  );
  return rows;
}

async function refreshOrgRating(organizationId) {
  await pool.query(
    `UPDATE organizations o SET
       rating_average = COALESCE((SELECT AVG(r.rating)::real FROM organization_reviews r WHERE r.organization_id = o.id), o.rating_average),
       rating_count = COALESCE((SELECT COUNT(*)::int FROM organization_reviews r WHERE r.organization_id = o.id), o.rating_count)
     WHERE o.id = $1`,
    [organizationId]
  );
}

export async function listReviewsForOrganization(organizationId, { limit = 50, offset = 0 } = {}) {
  const oid = Number(organizationId);
  if (!Number.isFinite(oid)) return [];
  const lim = Math.min(100, Math.max(1, Number(limit) || 50));
  const off = Math.max(0, Number(offset) || 0);
  const { rows } = await pool.query(
    `SELECT r.id, r.organization_id, r.user_id, r.rating, r.title, r.body, r.photo_urls, r.created_at,
            u.full_name AS reviewer_name
     FROM organization_reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.organization_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [oid, lim, off]
  );
  return rows.map((x) => ({
    ...x,
    photo_urls: parsePhotoUrls(x.photo_urls),
  }));
}

export async function upsertReviewForOrganization({ userId, organizationId, rating, title, body, photo_urls }) {
  const uid = Number(userId);
  const oid = Number(organizationId);
  const rt = Number(rating);
  if (!Number.isFinite(uid) || !Number.isFinite(oid) || !Number.isFinite(rt)) return null;
  const r = Math.min(5, Math.max(1, Math.round(rt)));
  const photos = Array.isArray(photo_urls)
    ? JSON.stringify(photo_urls.filter((p) => typeof p === "string" && p.trim()).slice(0, 12))
    : null;
  const { rows } = await pool.query(
    `INSERT INTO organization_reviews (organization_id, user_id, rating, title, body, photo_urls)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (organization_id, user_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       title = EXCLUDED.title,
       body = EXCLUDED.body,
       photo_urls = EXCLUDED.photo_urls
     RETURNING *`,
    [oid, uid, r, title?.trim() || null, body?.trim() || null, photos]
  );
  await refreshOrgRating(oid);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    photo_urls: parsePhotoUrls(row.photo_urls),
  };
}

/** Users to notify when org broadcasts: favorites + past customers (distinct). */
export async function listAudienceUserIdsForOrgBroadcast(organizationId) {
  const oid = Number(organizationId);
  if (!Number.isFinite(oid)) return [];
  const { rows } = await pool.query(
    `SELECT DISTINCT u.id
     FROM users u
     WHERE u.role = 'user' AND COALESCE(u.notify_org_broadcast, true) IS TRUE AND (
       EXISTS (
         SELECT 1 FROM user_org_favorites f WHERE f.organization_id = $1 AND f.user_id = u.id
       )
       OR EXISTS (
         SELECT 1 FROM appointments a
         INNER JOIN services s ON s.id = a.service_id
         WHERE s.organization_id = $1 AND a.owner_user_id = u.id AND a.status <> 'cancelled'
       )
     )`,
    [oid]
  );
  return rows.map((r) => Number(r.id)).filter(Number.isFinite);
}
