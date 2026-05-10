import pool from "../config/db.js";
import * as clinic from "./clinicRecords.service.js";
import { getOrganizationOwnerUserId } from "./organization.service.js";
import * as memberService from "./organizationMember.service.js";

async function assertUserInOrg(orgId, userId) {
  const owner = await getOrganizationOwnerUserId(orgId);
  if (owner != null && Number(owner) === Number(userId)) return true;
  const m = await memberService.getMembership(orgId, Number(userId));
  return Boolean(m);
}

function parseRange(fromRaw, toRaw) {
  const from = fromRaw ? new Date(String(fromRaw)) : null;
  const to = toRaw ? new Date(String(toRaw)) : null;
  if (from && Number.isNaN(from.getTime())) return { error: "BAD_FROM" };
  if (to && Number.isNaN(to.getTime())) return { error: "BAD_TO" };
  return { from, to };
}

export async function getSimpleDashboard(orgId) {
  const to = new Date();
  const from7 = new Date(to);
  from7.setUTCDate(from7.getUTCDate() - 7);
  const from30 = new Date(to);
  from30.setUTCDate(from30.getUTCDate() - 30);

  const qBook = async (f) => {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS c
       FROM appointments a
       INNER JOIN services s ON s.id = a.service_id
       WHERE s.organization_id = $1 AND a.status <> 'cancelled' AND a.starts_at >= $2::timestamptz`,
      [orgId, f.toISOString()]
    );
    return rows[0]?.c ?? 0;
  };

  const qSales = async (f) => {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(total_cents), 0)::bigint AS t
       FROM org_sales_orders
       WHERE organization_id = $1 AND occurred_at >= $2::timestamptz`,
      [orgId, f.toISOString()]
    );
    return Number(rows[0]?.t || 0);
  };

  const qAr = async () => {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(delta_cents), 0)::bigint AS t
       FROM org_customer_balance_lines WHERE organization_id = $1`,
      [orgId]
    );
    return Number(rows[0]?.t || 0);
  };

  const [b7, b30, s7, s30, arOpen] = await Promise.all([
    qBook(from7),
    qBook(from30),
    qSales(from7),
    qSales(from30),
    qAr(),
  ]);

  const { rows: lowStock } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM org_inventory_items
     WHERE organization_id = $1 AND low_stock_threshold IS NOT NULL
       AND quantity <= low_stock_threshold`,
    [orgId]
  );

  return {
    generated_at: to.toISOString(),
    bookings_last_7_days: b7,
    bookings_last_30_days: b30,
    retail_sales_cents_last_7_days: s7,
    retail_sales_cents_last_30_days: s30,
    open_receivable_cents: arOpen,
    low_stock_item_count: lowStock[0]?.c ?? 0,
  };
}

export async function getPeriodicalReport(orgId, fromIso, toIso) {
  const r = parseRange(fromIso, toIso);
  if (r.error) {
    const e = new Error(r.error);
    e.code = r.error;
    throw e;
  }
  let fromDt = r.from;
  let toDt = r.to;
  const now = new Date();
  if (!fromDt && !toDt) {
    toDt = now;
    fromDt = new Date(now);
    fromDt.setUTCDate(fromDt.getUTCDate() - 30);
  } else if (fromDt && !toDt) {
    toDt = now;
  } else if (!fromDt && toDt) {
    fromDt = new Date(toDt);
    fromDt.setUTCDate(fromDt.getUTCDate() - 30);
  }
  const from = fromDt.toISOString();
  const to = toDt.toISOString();

  const { rows: bk } = await pool.query(
    `SELECT COUNT(*)::int AS c,
            COUNT(DISTINCT a.owner_user_id)::int AS distinct_customers
      FROM appointments a
      INNER JOIN services s ON s.id = a.service_id
      WHERE s.organization_id = $1 AND a.status <> 'cancelled'
        AND a.starts_at >= $2::timestamptz AND a.starts_at < $3::timestamptz`,
    [orgId, from, to]
  );

  const { rows: rev } = await pool.query(
    `SELECT COALESCE(SUM(s.price_cents), 0)::bigint AS svc_cents
     FROM appointments a
     INNER JOIN services s ON s.id = a.service_id
     WHERE s.organization_id = $1 AND a.status <> 'cancelled'
       AND s.price_cents IS NOT NULL
       AND a.starts_at >= $2::timestamptz AND a.starts_at < $3::timestamptz`,
    [orgId, from, to]
  );

  const { rows: sal } = await pool.query(
    `SELECT COALESCE(SUM(total_cents), 0)::bigint AS retail_cents,
            COUNT(*)::int AS sale_count
     FROM org_sales_orders
     WHERE organization_id = $1
       AND occurred_at >= $2::timestamptz AND occurred_at < $3::timestamptz`,
    [orgId, from, to]
  );

  const { rows: pur } = await pool.query(
    `SELECT COALESCE(SUM(total_cents), 0)::bigint AS purchase_cents,
            COUNT(*)::int AS purchase_count
     FROM org_purchases
     WHERE organization_id = $1
       AND purchased_at >= $2::timestamptz AND purchased_at < $3::timestamptz`,
    [orgId, from, to]
  );

  return {
    from,
    to,
    appointments_count: bk[0]?.c ?? 0,
    distinct_booking_customers: bk[0]?.distinct_customers ?? 0,
    estimated_booked_service_value_cents: Number(rev[0]?.svc_cents || 0),
    retail_sales_cents: Number(sal[0]?.retail_cents || 0),
    retail_sale_count: sal[0]?.sale_count ?? 0,
    purchase_spend_cents: Number(pur[0]?.purchase_cents || 0),
    purchase_count: pur[0]?.purchase_count ?? 0,
  };
}

export async function getDistancingCustomers(orgId, { days_since = 90, limit = 80 } = {}) {
  const d = Math.min(730, Math.max(7, Number(days_since) || 90));
  const lim = Math.min(400, Math.max(1, Number(limit) || 80));
  const { rows } = await pool.query(
    `WITH last_visit AS (
       SELECT a.owner_user_id AS uid, MAX(a.starts_at) AS last_at
       FROM appointments a
       INNER JOIN services s ON s.id = a.service_id
       WHERE s.organization_id = $1 AND a.status <> 'cancelled'
       GROUP BY a.owner_user_id
     )
     SELECT u.id AS customer_user_id, u.full_name, u.email, u.phone,
            lv.last_at,
            EXTRACT(epoch FROM (NOW() - lv.last_at)) / 86400 AS days_since_visit
     FROM last_visit lv
     INNER JOIN users u ON u.id = lv.uid
     WHERE lv.last_at < NOW() - ($2::bigint * interval '1 day')
     ORDER BY lv.last_at ASC NULLS LAST
     LIMIT $3`,
    [orgId, d, lim]
  );
  return rows;
}

export async function getBusiestSlots(orgId, fromIso, toIso, { limit = 8 } = {}) {
  const r = parseRange(fromIso, toIso);
  if (r.error) {
    const e = new Error(r.error);
    e.code = r.error;
    throw e;
  }
  const from = r.from ? r.from.toISOString() : new Date(Date.now() - 30 * 864e5).toISOString();
  const to = r.to ? r.to.toISOString() : new Date().toISOString();
  const lim = Math.min(24, Math.max(3, Number(limit) || 8));

  const { rows: byDow } = await pool.query(
    `SELECT EXTRACT(DOW FROM a.starts_at AT TIME ZONE COALESCE(NULLIF(trim(a.display_timezone), ''), 'UTC'))::int AS dow,
            COUNT(*)::int AS appointment_count
     FROM appointments a
     INNER JOIN services s ON s.id = a.service_id
     WHERE s.organization_id = $1 AND a.status <> 'cancelled'
       AND a.starts_at >= $2::timestamptz AND a.starts_at < $3::timestamptz
     GROUP BY 1
     ORDER BY appointment_count DESC
     LIMIT $4`,
    [orgId, from, to, lim]
  );

  const { rows: byHour } = await pool.query(
    `SELECT EXTRACT(HOUR FROM a.starts_at AT TIME ZONE COALESCE(NULLIF(trim(a.display_timezone), ''), 'UTC'))::int AS hour_local,
            COUNT(*)::int AS appointment_count
     FROM appointments a
     INNER JOIN services s ON s.id = a.service_id
     WHERE s.organization_id = $1 AND a.status <> 'cancelled'
       AND a.starts_at >= $2::timestamptz AND a.starts_at < $3::timestamptz
     GROUP BY 1
     ORDER BY appointment_count DESC
     LIMIT $4`,
    [orgId, from, to, lim]
  );

  return { from, to, by_day_of_week: byDow, by_hour_local: byHour };
}

export async function getBestsellingServices(orgId, fromIso, toIso, { limit = 15 } = {}) {
  const r = parseRange(fromIso, toIso);
  if (r.error) {
    const e = new Error(r.error);
    e.code = r.error;
    throw e;
  }
  let fromDt = r.from;
  let toDt = r.to;
  const now = new Date();
  if (!fromDt && !toDt) {
    toDt = now;
    fromDt = new Date(now);
    fromDt.setUTCDate(fromDt.getUTCDate() - 90);
  } else if (fromDt && !toDt) {
    toDt = now;
  } else if (!fromDt && toDt) {
    fromDt = new Date(toDt);
    fromDt.setUTCDate(fromDt.getUTCDate() - 90);
  }
  const from = fromDt.toISOString();
  const to = toDt.toISOString();
  const lim = Math.min(50, Math.max(1, Number(limit) || 15));

  const { rows } = await pool.query(
    `SELECT s.id AS service_id, s.title AS service_title,
            COUNT(*)::int AS booking_count,
            COALESCE(AVG(s.price_cents), 0)::bigint AS avg_price_cents
     FROM appointments a
     INNER JOIN services s ON s.id = a.service_id
     WHERE s.organization_id = $1 AND a.status <> 'cancelled'
       AND a.starts_at >= $2::timestamptz AND a.starts_at < $3::timestamptz
     GROUP BY s.id, s.title
     ORDER BY booking_count DESC
     LIMIT $4`,
    [orgId, from, to, lim]
  );

  const { rows: retail } = await pool.query(
    `SELECT l.inventory_item_id, i.name AS product_name,
            SUM(l.quantity)::numeric AS qty_sold,
            SUM(l.line_total_cents)::bigint AS revenue_cents
     FROM org_sales_order_lines l
     INNER JOIN org_sales_orders o ON o.id = l.sale_id
     LEFT JOIN org_inventory_items i ON i.id = l.inventory_item_id
     WHERE o.organization_id = $1
       AND o.occurred_at >= $2::timestamptz AND o.occurred_at < $3::timestamptz
       AND l.inventory_item_id IS NOT NULL
     GROUP BY l.inventory_item_id, i.name
     ORDER BY revenue_cents DESC NULLS LAST
     LIMIT $4`,
    [orgId, from, to, lim]
  );

  const { rows: retailLines } = await pool.query(
    `SELECT SUM(l.line_total_cents)::bigint AS revenue_cents,
            SUM(l.quantity)::numeric AS qty_sold
     FROM org_sales_order_lines l
     INNER JOIN org_sales_orders o ON o.id = l.sale_id
     WHERE o.organization_id = $1
       AND o.occurred_at >= $2::timestamptz AND o.occurred_at < $3::timestamptz
       AND l.inventory_item_id IS NULL`,
    [orgId, from, to]
  );

  return {
    from,
    to,
    services: rows,
    retail_by_inventory_line: retail,
    retail_manual_lines_aggregate: {
      qty_sold: retailLines[0]?.qty_sold ?? 0,
      revenue_cents: Number(retailLines[0]?.revenue_cents || 0),
    },
  };
}

export async function getEmployeeBonusPreview(orgId, fromIso, toIso, opts = {}) {
  let commissionBp = Number(opts.commission_bp ?? opts.commission_bps);
  if (!Number.isFinite(commissionBp) && opts.commission_percent != null) {
    commissionBp = Math.round(Number(opts.commission_percent) * 100);
  }
  if (!Number.isFinite(commissionBp)) commissionBp = 1000;
  commissionBp = Math.min(10000, Math.max(0, commissionBp));
  const perBookingBonusCents = Math.max(0, Math.round(Number(opts.bonus_per_booking_cents ?? 0)));

  const r = parseRange(fromIso, toIso);
  if (r.error) {
    const e = new Error(r.error);
    e.code = r.error;
    throw e;
  }
  let fromDt = r.from;
  let toDt = r.to;
  const nowB = new Date();
  if (!fromDt && !toDt) {
    toDt = nowB;
    fromDt = new Date(nowB);
    fromDt.setUTCDate(fromDt.getUTCDate() - 30);
  } else if (fromDt && !toDt) {
    toDt = nowB;
  } else if (!fromDt && toDt) {
    fromDt = new Date(toDt);
    fromDt.setUTCDate(fromDt.getUTCDate() - 30);
  }
  const from = fromDt.toISOString();
  const to = toDt.toISOString();

  const { rows } = await pool.query(
    `SELECT a.clinic_staff_user_id AS user_id,
            COUNT(*) FILTER (WHERE a.status <> 'cancelled')::int AS bookings,
            COALESCE(SUM(CASE WHEN a.status <> 'cancelled' AND s.price_cents IS NOT NULL THEN s.price_cents ELSE 0 END), 0)::bigint AS attributed_service_cents
     FROM appointments a
     INNER JOIN services s ON s.id = a.service_id
     WHERE s.organization_id = $1
       AND a.starts_at >= $2::timestamptz AND a.starts_at < $3::timestamptz
       AND a.clinic_staff_user_id IS NOT NULL
     GROUP BY a.clinic_staff_user_id`,
    [orgId, from, to]
  );

  const ids = rows.map((x) => x.user_id).filter(Boolean);
  let names = {};
  if (ids.length) {
    const { rows: nr } = await pool.query(`SELECT id, full_name, email FROM users WHERE id = ANY($1::int[])`, [ids]);
    names = Object.fromEntries(nr.map((u) => [u.id, u]));
  }

  const staff = rows.map((row) => {
    const uid = Number(row.user_id);
    const attributed = Number(row.attributed_service_cents || 0);
    const bookings = Number(row.bookings || 0);
    const commission_cents = Math.floor((attributed * commissionBp) / 10000);
    const extras = bookings * perBookingBonusCents;
    return {
      user_id: uid,
      full_name: names[uid]?.full_name || null,
      email: names[uid]?.email || null,
      bookings_attributed: bookings,
      attributed_service_value_cents: attributed,
      commission_rate_bp: commissionBp,
      commission_cents_estimate: commission_cents,
      per_booking_bonus_cents_applied: perBookingBonusCents,
      booking_flat_bonus_cents: extras,
      total_bonus_estimate_cents: commission_cents + extras,
    };
  });

  return {
    from,
    to,
    commission_bp: commissionBp,
    disclaimer: "Indicative only — payroll rules are your accounting policy.",
    staff,
  };
}

export async function listPetWeights(orgId, petId) {
  const ok = await clinic.orgHasSeenPet(orgId, petId);
  if (!ok) {
    const e = new Error("PET_ACCESS");
    e.code = "PET_ACCESS";
    throw e;
  }
  const { rows } = await pool.query(
    `SELECT * FROM pet_weight_entries
     WHERE pet_id = $1 AND (organization_id IS NULL OR organization_id = $2)
     ORDER BY recorded_at DESC
     LIMIT 200`,
    [petId, orgId]
  );
  return rows;
}

export async function addPetWeight(orgId, actingUserId, petId, body) {
  const ok = await clinic.orgHasSeenPet(orgId, petId);
  if (!ok) {
    const e = new Error("PET_ACCESS");
    e.code = "PET_ACCESS";
    throw e;
  }
  const w = Number(body?.weight_kg ?? body?.weightKg);
  if (!(w > 0) || w > 500) {
    const e = new Error("BAD_WEIGHT");
    e.code = "BAD_WEIGHT";
    throw e;
  }
  const recordedAt = body?.recorded_at || null;
  const notes = body?.notes != null ? String(body.notes).trim().slice(0, 600) : null;
  const { rows } = await pool.query(
    `INSERT INTO pet_weight_entries (
       pet_id, organization_id, weight_kg, recorded_at, notes, recorded_by_user_id
     ) VALUES ($1,$2,$3, COALESCE($4::timestamptz, NOW()), $5, $6)
     RETURNING *`,
    [petId, orgId, w, recordedAt, notes, Number(actingUserId) || null]
  );
  return rows[0];
}

export async function deletePetWeight(orgId, entryId, actingUserId) {
  const eid = Number(entryId);
  if (!Number.isFinite(eid)) {
    const err = new Error("BAD_ID");
    err.code = "BAD_ID";
    throw err;
  }
  const { rowCount } = await pool.query(
    `DELETE FROM pet_weight_entries
     WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`,
    [eid, orgId]
  );
  return rowCount > 0;
}

export async function listLeaveRequests(orgId) {
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name AS user_full_name, u.email AS user_email,
            rb.full_name AS reviewer_name
     FROM staff_leave_requests r
     INNER JOIN users u ON u.id = r.user_id
     LEFT JOIN users rb ON rb.id = r.reviewed_by_user_id
     WHERE r.organization_id = $1
     ORDER BY r.created_at DESC
     LIMIT 200`,
    [orgId]
  );
  return rows;
}

export async function createLeaveRequest(orgId, userId, body) {
  const inOrg = await assertUserInOrg(orgId, userId);
  if (!inOrg) {
    const e = new Error("NOT_IN_ORG");
    e.code = "NOT_IN_ORG";
    throw e;
  }
  const sd = body?.start_date || body?.startDate;
  const ed = body?.end_date || body?.endDate;
  const reason = body?.reason != null ? String(body.reason).trim().slice(0, 1200) : null;
  if (!sd || !ed) {
    const e = new Error("DATES_REQUIRED");
    e.code = "DATES_REQUIRED";
    throw e;
  }
  const { rows } = await pool.query(
    `INSERT INTO staff_leave_requests (
       organization_id, user_id, start_date, end_date, reason, status
     ) VALUES ($1,$2,$3::date,$4::date,$5,'pending')
     RETURNING *`,
    [orgId, userId, sd, ed, reason]
  );
  return rows[0];
}

export async function reviewLeaveRequest(orgId, reviewerUserId, requestId, body) {
  const rid = Number(requestId);
  if (!Number.isFinite(rid)) {
    const e = new Error("BAD_ID");
    e.code = "BAD_ID";
    throw e;
  }
  const status = String(body?.status || "").toLowerCase();
  if (!["approved", "rejected"].includes(status)) {
    const e = new Error("BAD_STATUS");
    e.code = "BAD_STATUS";
    throw e;
  }
  const notes = body?.review_notes != null ? String(body.review_notes).trim().slice(0, 600) : null;
  const { rows } = await pool.query(
    `UPDATE staff_leave_requests SET
       status = $1,
       reviewed_by_user_id = $2,
       review_notes = COALESCE($3, review_notes)
     WHERE id = $4 AND organization_id = $5 AND status = 'pending'
     RETURNING *`,
    [status, Number(reviewerUserId) || null, notes, rid, orgId]
  );
  if (!rows.length) {
    const e = new Error("NOT_PENDING");
    e.code = "NOT_PENDING";
    throw e;
  }
  return rows[0];
}

export async function getAdvancedReport(orgId, query) {
  const fromIso = query.from;
  const toIso = query.to;
  const days = Number(query.days || 90);

  const [busy, bestsellers, distancing, periodical, bonus] = await Promise.all([
    getBusiestSlots(orgId, fromIso, toIso, {}).catch(() => ({ error: true })),
    getBestsellingServices(orgId, fromIso, toIso, {}).catch(() => ({ error: true })),
    getDistancingCustomers(orgId, { days_since: days, limit: 50 }).catch(() => []),
    getPeriodicalReport(orgId, fromIso, toIso).catch(() => ({ error: true })),
    getEmployeeBonusPreview(orgId, fromIso, toIso, {
      commission_bp: Number(query.commission_bp || 1000),
      bonus_per_booking_cents: Number(query.bonus_per_booking_cents || 0),
    }).catch(() => ({ error: true })),
  ]);

  const simple = await getSimpleDashboard(orgId).catch(() => ({}));

  return {
    window: {
      from: fromIso || null,
      to: toIso || null,
      distancing_days_idle: days,
    },
    simple_snapshot_extensions: simple,
    periodical_summary: periodical,
    busiest: busy,
    bestsellers_combo: bestsellers,
    inactive_customers: distancing,
    bonus_preview_default_params: bonus,
  };
}
