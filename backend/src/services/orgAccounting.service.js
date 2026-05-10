import pool from "../config/db.js";
import * as clinic from "./clinicRecords.service.js";

const DEFAULT_CATEGORIES = [
  ["Retail sales", "revenue"],
  ["Services & packages", "revenue"],
  ["Cost of goods", "expense"],
  ["Rent & utilities", "expense"],
  ["General expense", "expense"],
];

export async function seedDefaultCategories(orgId) {
  const oid = Number(orgId);
  for (const [name, kind] of DEFAULT_CATEGORIES) {
    await pool.query(
      `INSERT INTO org_account_categories (organization_id, name, kind)
       VALUES ($1,$2,$3)
       ON CONFLICT (organization_id, name) DO NOTHING`,
      [oid, name, kind]
    );
  }
}

export async function listCategories(orgId) {
  await seedDefaultCategories(orgId);
  const { rows } = await pool.query(
    `SELECT * FROM org_account_categories WHERE organization_id = $1 ORDER BY sort_order, name`,
    [orgId]
  );
  return rows;
}

export async function createCategory(orgId, body) {
  const name = String(body?.name || "").trim();
  if (!name) {
    const e = new Error("NAME_REQUIRED");
    e.code = "NAME_REQUIRED";
    throw e;
  }
  const kind = String(body?.kind || "expense").trim().slice(0, 24);
  try {
    const { rows } = await pool.query(
      `INSERT INTO org_account_categories (organization_id, name, kind)
       VALUES ($1,$2,$3) RETURNING *`,
      [orgId, name, kind]
    );
    return rows[0];
  } catch (err) {
    if (String(err.code) === "23505") {
      const e = new Error("DUPLICATE_CATEGORY");
      e.code = "DUPLICATE_CATEGORY";
      throw e;
    }
    throw err;
  }
}

export async function listLedgerLines(orgId, { limit = 100, from = null, to = null } = {}) {
  const lim = Math.min(300, Math.max(1, Number(limit) || 100));
  const params = [orgId, lim];
  let whereExtra = "";
  if (from) {
    params.push(from);
    whereExtra += ` AND line_at >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    whereExtra += ` AND line_at < $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT l.*, c.name AS category_name, c.kind AS category_kind
     FROM org_accounting_lines l
     LEFT JOIN org_account_categories c ON c.id = l.category_id
     WHERE l.organization_id = $1 ${whereExtra}
     ORDER BY l.line_at DESC
     LIMIT $2`,
    params
  );
  return rows;
}

export async function addLedgerLine(orgId, userId, body) {
  const flow = String(body?.flow || "").toLowerCase();
  if (!["in", "out"].includes(flow)) {
    const e = new Error("BAD_FLOW");
    e.code = "BAD_FLOW";
    throw e;
  }
  const amount = Number(body?.amount_cents ?? body?.amount);
  const cents = Number.isFinite(amount) ? Math.round(amount) : 0;
  if (cents <= 0 || cents > 1_000_000_000) {
    const e = new Error("BAD_AMOUNT");
    e.code = "BAD_AMOUNT";
    throw e;
  }
  let categoryId = body?.category_id != null ? Number(body.category_id) : null;
  if (categoryId != null && Number.isFinite(categoryId)) {
    const { rows } = await pool.query(
      `SELECT 1 FROM org_account_categories WHERE id = $1 AND organization_id = $2`,
      [categoryId, orgId]
    );
    if (!rows.length) categoryId = null;
  }
  const memo = body?.memo != null ? String(body.memo).trim().slice(0, 400) : "";
  const { rows } = await pool.query(
    `INSERT INTO org_accounting_lines (
       organization_id, line_at, flow, category_id, amount_cents, memo, created_by_user_id
     ) VALUES ($1, COALESCE($2::timestamptz, NOW()), $3, $4, $5, $6, $7)
     RETURNING *`,
    [orgId, body?.line_at || null, flow, categoryId, cents, memo || null, Number(userId) || null]
  );
  return rows[0];
}

export async function listPurchases(orgId, { limit = 80 } = {}) {
  const lim = Math.min(200, Math.max(1, Number(limit) || 80));
  const { rows } = await pool.query(
    `SELECT * FROM org_purchases WHERE organization_id = $1 ORDER BY purchased_at DESC LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function getPurchase(orgId, purchaseId) {
  const { rows } = await pool.query(
    `SELECT * FROM org_purchases WHERE id = $1 AND organization_id = $2`,
    [purchaseId, orgId]
  );
  if (!rows.length) return null;
  const lines = await pool.query(`SELECT * FROM org_purchase_lines WHERE purchase_id = $1 ORDER BY id`, [
    purchaseId,
  ]);
  return { ...rows[0], lines: lines.rows };
}

export async function createPurchase(orgId, userId, body) {
  const vendor = String(body?.vendor_name || "Vendor").trim().slice(0, 160) || "Vendor";
  const reference = body?.reference != null ? String(body.reference).trim().slice(0, 120) : null;
  const notes = body?.notes != null ? String(body.notes).trim() : null;
  const purchasedAt = body?.purchased_at || null;
  const linesRaw = Array.isArray(body?.lines) ? body.lines : [];
  if (!linesRaw.length) {
    const e = new Error("LINES_REQUIRED");
    e.code = "LINES_REQUIRED";
    throw e;
  }

  const lines = [];
  let total = 0;
  for (const ln of linesRaw) {
    const qty = Number(ln.quantity ?? 1);
    if (!(qty > 0)) continue;
    const unit = Math.round(Number(ln.unit_cost_cents ?? ln.unit_cost));
    const desc = String(ln.description || "Item").trim().slice(0, 220) || "Item";
    const lt = ln.line_total_cents != null ? Math.round(Number(ln.line_total_cents)) : Math.round(qty * unit);
    total += lt;
    const iid = ln.inventory_item_id != null ? Number(ln.inventory_item_id) : null;
    lines.push({
      inventory_item_id: Number.isFinite(iid) && iid > 0 ? iid : null,
      description: desc,
      quantity: qty,
      unit_cost_cents: unit >= 0 ? unit : 0,
      line_total_cents: lt >= 0 ? lt : 0,
    });
  }
  if (!lines.length) {
    const e = new Error("LINES_REQUIRED");
    e.code = "LINES_REQUIRED";
    throw e;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hdr = await client.query(
      `INSERT INTO org_purchases (
         organization_id, vendor_name, reference, total_cents, notes, purchased_at, created_by_user_id
       ) VALUES ($1,$2,$3,$4,$5, COALESCE($6::timestamptz, NOW()), $7)
       RETURNING *`,
      [orgId, vendor, reference, total, notes, purchasedAt, Number(userId) || null]
    );
    const p = hdr.rows[0];

    for (const ln of lines) {
      await client.query(
        `INSERT INTO org_purchase_lines (
           purchase_id, inventory_item_id, description, quantity, unit_cost_cents, line_total_cents
         ) VALUES ($1,$2,$3,$4,$5,$6)`,
        [p.id, ln.inventory_item_id, ln.description, ln.quantity, ln.unit_cost_cents, ln.line_total_cents]
      );
      if (ln.inventory_item_id) {
        const upd = await client.query(
          `UPDATE org_inventory_items
           SET quantity = quantity + $1::numeric, updated_at = NOW()
           WHERE id = $2 AND organization_id = $3
           RETURNING id`,
          [ln.quantity, ln.inventory_item_id, orgId]
        );
        if (upd.rows.length === 0) throw Object.assign(new Error("BAD_INV"), { code: "BAD_INV_ITEM" });
      }
    }

    await client.query("COMMIT");
    return getPurchase(orgId, p.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listSales(orgId, { limit = 80 } = {}) {
  const lim = Math.min(200, Math.max(1, Number(limit) || 80));
  const { rows } = await pool.query(
    `SELECT * FROM org_sales_orders WHERE organization_id = $1 ORDER BY occurred_at DESC LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function getSale(orgId, saleId) {
  const { rows } = await pool.query(
    `SELECT * FROM org_sales_orders WHERE id = $1 AND organization_id = $2`,
    [saleId, orgId]
  );
  if (!rows.length) return null;
  const lines = await pool.query(`SELECT * FROM org_sales_order_lines WHERE sale_id = $1 ORDER BY id`, [saleId]);
  return { ...rows[0], lines: lines.rows };
}

export async function createSale(orgId, userId, body) {
  const channel = String(body?.channel || "pos").trim().slice(0, 24);
  const paymentMethod = String(body?.payment_method || "cash").trim().slice(0, 24);
  const custRaw = body?.customer_user_id ?? body?.customerUserId;
  const customerUserId =
    custRaw != null && String(custRaw).trim() !== "" ? Number(custRaw) : null;

  const notes = body?.notes != null ? String(body.notes).trim() : null;
  const occurredAt = body?.occurred_at || null;
  const paidCentsRaw = Number(body?.paid_cents ?? 0);
  const linesRaw = Array.isArray(body?.lines) ? body.lines : [];
  if (!linesRaw.length) {
    const e = new Error("LINES_REQUIRED");
    e.code = "LINES_REQUIRED";
    throw e;
  }

  const lines = [];
  let total = 0;
  for (const ln of linesRaw) {
    const qty = Number(ln.quantity ?? 1);
    if (!(qty > 0)) continue;
    const unit = Math.round(Number(ln.unit_price_cents ?? ln.unit_price));
    const desc = String(ln.description || "Item").trim().slice(0, 220) || "Item";
    const lt = ln.line_total_cents != null ? Math.round(Number(ln.line_total_cents)) : Math.round(qty * unit);
    total += lt;
    const iid = ln.inventory_item_id != null ? Number(ln.inventory_item_id) : null;
    lines.push({
      inventory_item_id: Number.isFinite(iid) && iid > 0 ? iid : null,
      description: desc,
      quantity: qty,
      unit_price_cents: unit >= 0 ? unit : 0,
      line_total_cents: lt >= 0 ? lt : 0,
    });
  }
  if (!lines.length) {
    const e = new Error("LINES_REQUIRED");
    e.code = "LINES_REQUIRED";
    throw e;
  }

  let paid_cents;
  if (paymentMethod === "account") {
    const p = Math.round(Number.isFinite(paidCentsRaw) ? paidCentsRaw : 0);
    paid_cents = Math.max(0, Math.min(total, p));
  } else {
    paid_cents =
      body?.paid_cents !== undefined && body?.paid_cents !== null
        ? Math.max(0, Math.min(total, Math.round(Number(body.paid_cents))))
        : total;
  }
  const unpaid = total - paid_cents;
  if (unpaid > 0) {
    if (!Number.isFinite(customerUserId)) {
      const e = new Error("CUSTOMER_REQUIRED_FOR_CREDIT");
      e.code = "CUSTOMER_REQUIRED_FOR_CREDIT";
      throw e;
    }
    const known = await clinic.assertOrgKnowsCustomer(orgId, customerUserId);
    if (!known) {
      const e = new Error("UNKNOWN_CUSTOMER");
      e.code = "UNKNOWN_CUSTOMER";
      throw e;
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ord = await client.query(
      `INSERT INTO org_sales_orders (
         organization_id, customer_user_id, channel, payment_method,
         total_cents, paid_cents, notes, occurred_at, created_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::timestamptz, NOW()), $9)
       RETURNING *`,
      [
        orgId,
        Number.isFinite(customerUserId) ? customerUserId : null,
        channel,
        paymentMethod,
        total,
        paid_cents,
        notes,
        occurredAt,
        Number(userId) || null,
      ]
    );
    const saleRow = ord.rows[0];

    for (const ln of lines) {
      await client.query(
        `INSERT INTO org_sales_order_lines (
           sale_id, inventory_item_id, description, quantity, unit_price_cents, line_total_cents
         ) VALUES ($1,$2,$3,$4,$5,$6)`,
        [saleRow.id, ln.inventory_item_id, ln.description, ln.quantity, ln.unit_price_cents, ln.line_total_cents]
      );
      if (ln.inventory_item_id) {
        const upd = await client.query(
          `UPDATE org_inventory_items
           SET quantity = quantity - $1::numeric, updated_at = NOW()
           WHERE id = $2 AND organization_id = $3 AND quantity >= $1::numeric
           RETURNING id`,
          [ln.quantity, ln.inventory_item_id, orgId]
        );
        if (upd.rows.length === 0) {
          const err = new Error("INSUFFICIENT_STOCK");
          err.code = "INSUFFICIENT_STOCK";
          throw err;
        }
      }
    }

    if (unpaid > 0) {
      await client.query(
        `INSERT INTO org_customer_balance_lines (
           organization_id, customer_user_id, delta_cents, kind, description, sale_id, created_by_user_id
         ) VALUES ($1,$2,$3,'charge',$4,$5,$6)`,
        [
          orgId,
          customerUserId,
          unpaid,
          `Sale #${saleRow.id}`,
          saleRow.id,
          Number(userId) || null,
        ]
      );
    }

    await client.query("COMMIT");
    return getSale(orgId, saleRow.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function findInventoryBySku(orgId, skuRaw) {
  const sku = String(skuRaw || "").trim();
  if (!sku) return { item: null, ambiguous: false };
  const { rows } = await pool.query(
    `SELECT * FROM org_inventory_items WHERE organization_id = $1 AND sku IS NOT NULL AND TRIM(sku) = $2 ORDER BY id LIMIT 5`,
    [orgId, sku]
  );
  if (rows.length === 0) return { item: null, ambiguous: false };
  return { item: rows[0], ambiguous: rows.length > 1, matches: rows.length };
}

export async function listDebtors(orgId) {
  const { rows } = await pool.query(
    `SELECT
        c.customer_user_id,
        u.full_name,
        u.email,
        u.phone,
        SUM(c.delta_cents)::bigint AS balance_cents,
        MAX(c.created_at) AS last_movement_at
     FROM org_customer_balance_lines c
     JOIN users u ON u.id = c.customer_user_id
     WHERE c.organization_id = $1 AND c.customer_user_id IS NOT NULL
     GROUP BY c.customer_user_id, u.full_name, u.email, u.phone
     HAVING SUM(c.delta_cents) > 0
     ORDER BY balance_cents DESC`,
    [orgId]
  );
  return rows;
}

export async function customerStatement(orgId, customerUserId, { from = null, to = null } = {}) {
  const cid = Number(customerUserId);
  if (!Number.isFinite(cid)) return null;
  const known = await clinic.assertOrgKnowsCustomer(orgId, cid);
  if (!known) {
    const e = new Error("UNKNOWN_CUSTOMER");
    e.code = "UNKNOWN_CUSTOMER";
    throw e;
  }

  const params = [orgId, cid];
  let w = "";
  if (from) {
    params.push(from);
    w += ` AND created_at >= $${params.length}::timestamptz`;
  }
  if (to) {
    params.push(to);
    w += ` AND created_at < $${params.length}::timestamptz`;
  }

  const { rows } = await pool.query(
    `SELECT * FROM org_customer_balance_lines
     WHERE organization_id = $1 AND customer_user_id = $2 ${w}
     ORDER BY created_at ASC, id ASC`,
    params
  );

  let balance = 0;
  const withRun = rows.map((r) => {
    balance += Number(r.delta_cents) || 0;
    return { ...r, running_balance_cents: balance };
  });
  const owed = rows.reduce((s, r) => s + (Number(r.delta_cents) || 0), 0);
  return { lines: withRun, balance_cents_end: owed, customer_user_id: cid };
}

export async function postCustomerCharge(orgId, staffUserId, customerUserId, body) {
  const cid = Number(customerUserId);
  if (!Number.isFinite(cid)) {
    const e = new Error("BAD_CUSTOMER");
    e.code = "BAD_CUSTOMER";
    throw e;
  }
  const known = await clinic.assertOrgKnowsCustomer(orgId, cid);
  if (!known) {
    const e = new Error("UNKNOWN_CUSTOMER");
    e.code = "UNKNOWN_CUSTOMER";
    throw e;
  }
  const amount = Math.round(Number(body?.amount_cents ?? body?.amount));
  if (!(amount > 0)) {
    const e = new Error("BAD_AMOUNT");
    e.code = "BAD_AMOUNT";
    throw e;
  }
  const memo = String(body?.description || "Manual charge").trim().slice(0, 300) || "Manual charge";
  const { rows } = await pool.query(
    `INSERT INTO org_customer_balance_lines (
       organization_id, customer_user_id, delta_cents, kind, description, created_by_user_id
     ) VALUES ($1,$2,$3,'manual_charge',$4,$5) RETURNING *`,
    [orgId, cid, amount, memo, Number(staffUserId) || null]
  );
  return rows[0];
}

export async function postCustomerPayment(orgId, staffUserId, customerUserId, body) {
  const cid = Number(customerUserId);
  if (!Number.isFinite(cid)) {
    const e = new Error("BAD_CUSTOMER");
    e.code = "BAD_CUSTOMER";
    throw e;
  }
  const known = await clinic.assertOrgKnowsCustomer(orgId, cid);
  if (!known) {
    const e = new Error("UNKNOWN_CUSTOMER");
    e.code = "UNKNOWN_CUSTOMER";
    throw e;
  }
  const amount = Math.round(Number(body?.amount_cents ?? body?.amount));
  if (!(amount > 0)) {
    const e = new Error("BAD_AMOUNT");
    e.code = "BAD_AMOUNT";
    throw e;
  }
  const memo = String(body?.memo || "Payment").trim().slice(0, 300) || "Payment";

  const { rows } = await pool.query(
    `INSERT INTO org_customer_balance_lines (
       organization_id, customer_user_id, delta_cents, kind, description, created_by_user_id
     ) VALUES ($1,$2,$3,'payment',$4,$5) RETURNING *`,
    [orgId, cid, -amount, memo, Number(staffUserId) || null]
  );

  await seedDefaultCategories(orgId);
  const cat = await pool.query(
    `SELECT id FROM org_account_categories WHERE organization_id = $1 AND kind = 'revenue' ORDER BY id LIMIT 1`,
    [orgId]
  );
  const revId = cat.rows[0]?.id ?? null;
  await pool.query(
    `INSERT INTO org_accounting_lines (
       organization_id, flow, category_id, amount_cents, memo, created_by_user_id
     ) VALUES ($1,'in',$2,$3,$4,$5)`,
    [orgId, revId, amount, `Collected AR: ${memo}`, Number(staffUserId) || null]
  );

  return rows[0];
}

export async function listTillSessions(orgId, { limit = 60 } = {}) {
  const lim = Math.min(150, Math.max(1, Number(limit) || 60));
  const { rows } = await pool.query(
    `SELECT * FROM org_till_sessions WHERE organization_id = $1 ORDER BY opened_at DESC LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function getOpenTill(orgId) {
  const { rows } = await pool.query(
    `SELECT * FROM org_till_sessions WHERE organization_id = $1 AND status = 'open' ORDER BY opened_at DESC LIMIT 1`,
    [orgId]
  );
  return rows[0] || null;
}

export async function openTillSession(orgId, userId, body) {
  const open = await getOpenTill(orgId);
  if (open) {
    const e = new Error("TILL_ALREADY_OPEN");
    e.code = "TILL_ALREADY_OPEN";
    throw e;
  }
  const opening = Math.round(Number(body?.opening_float_cents ?? 0));
  const notes = body?.notes != null ? String(body.notes).trim() : null;
  const { rows } = await pool.query(
    `INSERT INTO org_till_sessions (
       organization_id, status, opening_float_cents, notes, opened_by_user_id
     ) VALUES ($1,'open',$2,$3,$4) RETURNING *`,
    [orgId, Number.isFinite(opening) && opening >= 0 ? opening : 0, notes, Number(userId) || null]
  );
  return rows[0];
}

export async function closeTillSession(orgId, userId, sessionId, body) {
  const sid = Number(sessionId);
  if (!Number.isFinite(sid)) {
    const e = new Error("BAD_SESSION");
    e.code = "BAD_SESSION";
    throw e;
  }
  const counted = Math.round(Number(body?.closing_counted_cents));
  if (!Number.isFinite(counted)) {
    const e = new Error("BAD_COUNTED");
    e.code = "BAD_COUNTED";
    throw e;
  }
  const closeNotes = body?.closing_notes != null ? String(body.closing_notes).trim().slice(0, 2000) : null;
  const res = await pool.query(
    `UPDATE org_till_sessions SET
       status = 'closed',
       closed_at = NOW(),
       closing_counted_cents = $1,
       closing_notes = COALESCE($2, closing_notes),
       closed_by_user_id = $3
     WHERE id = $4 AND organization_id = $5 AND status = 'open'
     RETURNING *`,
    [counted, closeNotes, Number(userId) || null, sid, orgId]
  );
  if (!res.rows.length) {
    const e = new Error("SESSION_NOT_OPEN");
    e.code = "SESSION_NOT_OPEN";
    throw e;
  }
  return res.rows[0];
}
