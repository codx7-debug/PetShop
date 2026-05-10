import pool from "../config/db.js";

function mapRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    organization_id: r.organization_id,
    title: r.title,
    description: r.description,
    icon_emoji: r.icon_emoji,
    valid_until: r.valid_until
      ? r.valid_until instanceof Date
        ? r.valid_until.toISOString().slice(0, 10)
        : String(r.valid_until).slice(0, 10)
      : null,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
    organization_display_name: r.organization_display_name ?? undefined,
  };
}

/** Pet-parent Offers screen: active offers from any org, not past valid_until. */
export async function listPublicActiveOffers() {
  const { rows } = await pool.query(
    `SELECT o.id, o.organization_id, o.title, o.description, o.icon_emoji, o.valid_until,
            o.is_active, o.created_at, o.updated_at, org.display_name AS organization_display_name
     FROM organization_offers o
     INNER JOIN organizations org ON org.id = o.organization_id
     WHERE o.is_active = true
       AND (o.valid_until IS NULL OR o.valid_until >= CURRENT_DATE)
     ORDER BY o.created_at DESC
     LIMIT 200`
  );
  return rows.map(mapRow);
}

export async function listOffersForOrganization(organizationId) {
  const { rows } = await pool.query(
    `SELECT o.id, o.organization_id, o.title, o.description, o.icon_emoji, o.valid_until,
            o.is_active, o.created_at, o.updated_at, org.display_name AS organization_display_name
     FROM organization_offers o
     INNER JOIN organizations org ON org.id = o.organization_id
     WHERE o.organization_id = $1
     ORDER BY o.created_at DESC`,
    [organizationId]
  );
  return rows.map(mapRow);
}

export async function createOffer(organizationId, body) {
  const title = String(body?.title || "").trim();
  if (!title) return null;
  const description = body?.description != null ? String(body.description) : null;
  const iconEmoji = body?.icon_emoji != null ? String(body.icon_emoji).trim().slice(0, 16) || "🎁" : "🎁";
  let validUntil = null;
  if (body?.valid_until != null && String(body.valid_until).trim() !== "") {
    validUntil = String(body.valid_until).trim().slice(0, 10);
  }
  const isActive = body?.is_active === false ? false : true;

  const { rows } = await pool.query(
    `INSERT INTO organization_offers (organization_id, title, description, icon_emoji, valid_until, is_active)
     VALUES ($1, $2, $3, $4, $5::date, $6)
     RETURNING id, organization_id, title, description, icon_emoji, valid_until, is_active, created_at, updated_at`,
    [organizationId, title, description, iconEmoji, validUntil, isActive]
  );
  const row = rows[0];
  if (!row) return null;
  const name = await pool.query(`SELECT display_name FROM organizations WHERE id = $1`, [organizationId]);
  return mapRow({ ...row, organization_display_name: name.rows[0]?.display_name });
}

export async function updateOffer(organizationId, offerId, body) {
  const id = Number(offerId);
  if (!Number.isFinite(id)) return null;

  const cur = await pool.query(
    `SELECT id FROM organization_offers WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  );
  if (!cur.rowCount) return null;

  const fields = [];
  const vals = [];
  let pi = 1;

  if (body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) return null;
    fields.push(`title = $${pi++}`);
    vals.push(title);
  }
  if (body.description !== undefined) {
    fields.push(`description = $${pi++}`);
    vals.push(body.description != null ? String(body.description) : null);
  }
  if (body.icon_emoji !== undefined) {
    fields.push(`icon_emoji = $${pi++}`);
    vals.push(String(body.icon_emoji || "🎁").trim().slice(0, 16) || "🎁");
  }
  if (body.valid_until !== undefined) {
    const raw = body.valid_until;
    if (raw === null || String(raw).trim() === "") {
      fields.push(`valid_until = NULL`);
    } else {
      fields.push(`valid_until = $${pi++}::date`);
      vals.push(String(raw).trim().slice(0, 10));
    }
  }
  if (body.is_active !== undefined) {
    fields.push(`is_active = $${pi++}`);
    vals.push(Boolean(body.is_active));
  }

  if (!fields.length) {
    const { rows } = await pool.query(
      `SELECT o.id, o.organization_id, o.title, o.description, o.icon_emoji, o.valid_until,
              o.is_active, o.created_at, o.updated_at, org.display_name AS organization_display_name
       FROM organization_offers o
       INNER JOIN organizations org ON org.id = o.organization_id
       WHERE o.id = $1 AND o.organization_id = $2`,
      [id, organizationId]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  fields.push(`updated_at = NOW()`);
  const idPl = pi++;
  const orgPl = pi++;
  vals.push(id, organizationId);

  const { rows } = await pool.query(
    `UPDATE organization_offers SET ${fields.join(", ")}
     WHERE id = $${idPl} AND organization_id = $${orgPl}
     RETURNING id, organization_id, title, description, icon_emoji, valid_until, is_active, created_at, updated_at`,
    vals
  );
  const row = rows[0];
  if (!row) return null;
  const name = await pool.query(`SELECT display_name FROM organizations WHERE id = $1`, [organizationId]);
  return mapRow({ ...row, organization_display_name: name.rows[0]?.display_name });
}

export async function deleteOffer(organizationId, offerId) {
  const id = Number(offerId);
  if (!Number.isFinite(id)) return false;
  const r = await pool.query(
    `DELETE FROM organization_offers WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  );
  return r.rowCount > 0;
}
