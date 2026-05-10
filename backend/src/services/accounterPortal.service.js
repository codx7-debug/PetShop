import pool from "../config/db.js";

const DEFAULT_DAYS = 30;

export async function getGlobalFinanceSummary({ windowDays = DEFAULT_DAYS } = {}) {
  const d = Math.min(365 * 2, Math.max(1, Number(windowDays) || DEFAULT_DAYS));
  const { rows } = await pool.query(
    `WITH win AS (SELECT NOW() - ($1::int * interval '1 day') AS t0)
     SELECT
       (SELECT COALESCE(SUM(o.total_cents), 0)::bigint
        FROM org_sales_orders o, win
        WHERE o.occurred_at >= win.t0) AS retail_sales_cents,
       (SELECT COALESCE(SUM(p.total_cents), 0)::bigint
        FROM org_purchases p, win
        WHERE p.purchased_at >= win.t0) AS purchase_spend_cents,
       (SELECT COALESCE(SUM(c.delta_cents), 0)::bigint
        FROM org_customer_balance_lines c) AS open_receivable_cents`,
    [d]
  );
  const { rows: orgCount } = await pool.query(`SELECT COUNT(*)::int AS c FROM organizations`);
  return {
    window_days: d,
    organization_count: orgCount[0]?.c ?? 0,
    retail_sales_cents_period: Number(rows[0]?.retail_sales_cents || 0),
    purchase_spend_cents_period: Number(rows[0]?.purchase_spend_cents || 0),
    open_receivable_cents_total: Number(rows[0]?.open_receivable_cents || 0),
  };
}

export async function listGlobalRecentSales({ limit = 100, organization_id = null } = {}) {
  const lim = Math.min(500, Math.max(1, Number(limit) || 100));
  const oid = organization_id != null ? Number(organization_id) : null;
  const params = oid != null && Number.isFinite(oid) ? [lim, oid] : [lim];
  const orgFilter = oid != null && Number.isFinite(oid) ? `AND o.organization_id = $2` : "";
  /* Accountant view: totals and payment method only — no customer_user_id, channel, or line-level flags. */
  const { rows } = await pool.query(
    `SELECT o.id, o.organization_id, org.display_name AS organization_name,
            o.total_cents, o.payment_method, o.occurred_at
     FROM org_sales_orders o
     INNER JOIN organizations org ON org.id = o.organization_id
     WHERE 1=1 ${orgFilter}
     ORDER BY o.occurred_at DESC
     LIMIT $1`,
    params
  );
  return rows;
}

export async function listGlobalRecentPurchases({ limit = 100, organization_id = null } = {}) {
  const lim = Math.min(500, Math.max(1, Number(limit) || 100));
  const oid = organization_id != null ? Number(organization_id) : null;
  const params = oid != null && Number.isFinite(oid) ? [lim, oid] : [lim];
  const orgFilter = oid != null && Number.isFinite(oid) ? `AND p.organization_id = $2` : "";
  const { rows } = await pool.query(
    `SELECT p.id, p.organization_id, org.display_name AS organization_name,
            p.vendor_name, p.reference, p.total_cents, p.purchased_at
     FROM org_purchases p
     INNER JOIN organizations org ON org.id = p.organization_id
     WHERE 1=1 ${orgFilter}
     ORDER BY p.purchased_at DESC
     LIMIT $1`,
    params
  );
  return rows;
}

export async function listReceivablesByOrganization() {
  const { rows } = await pool.query(
    `SELECT c.organization_id, org.display_name AS organization_name,
            SUM(c.delta_cents)::bigint AS balance_cents
     FROM org_customer_balance_lines c
     INNER JOIN organizations org ON org.id = c.organization_id
     GROUP BY c.organization_id, org.display_name
     HAVING SUM(c.delta_cents) <> 0
     ORDER BY balance_cents DESC`
  );
  return rows.map((r) => ({
    ...r,
    balance_cents: Number(r.balance_cents || 0),
  }));
}

export async function listOrganizationsForFilter() {
  const { rows } = await pool.query(`SELECT id, display_name FROM organizations ORDER BY display_name ASC`);
  return rows;
}

export async function listRecentLedgerFlows({ limit = 80 } = {}) {
  const lim = Math.min(300, Math.max(1, Number(limit) || 80));
  const { rows } = await pool.query(
    `SELECT l.id, l.organization_id, org.display_name AS organization_name,
            l.flow, l.amount_cents, l.line_at,
            cat.name AS category_name
     FROM org_accounting_lines l
     INNER JOIN organizations org ON org.id = l.organization_id
     LEFT JOIN org_account_categories cat ON cat.id = l.category_id
     ORDER BY l.line_at DESC
     LIMIT $1`,
    [lim]
  );
  return rows;
}
