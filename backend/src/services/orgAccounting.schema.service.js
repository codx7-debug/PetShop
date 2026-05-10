import pool from "../config/db.js";

export async function initOrgAccountingSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_account_categories (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      kind VARCHAR(24) NOT NULL DEFAULT 'expense',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (organization_id, name)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_org_acct_cat_org ON org_account_categories (organization_id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_accounting_lines (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      line_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      flow VARCHAR(8) NOT NULL CHECK (flow IN ('in', 'out')),
      category_id INTEGER REFERENCES org_account_categories(id) ON DELETE SET NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      memo VARCHAR(400),
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_org_acct_lines_org ON org_accounting_lines (organization_id, line_at DESC)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_sales_orders (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      customer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      channel VARCHAR(24) NOT NULL DEFAULT 'pos',
      payment_method VARCHAR(24) NOT NULL DEFAULT 'cash',
      total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
      paid_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
      notes TEXT,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_org_sales_org ON org_sales_orders (organization_id, occurred_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_sales_order_lines (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER NOT NULL REFERENCES org_sales_orders(id) ON DELETE CASCADE,
      inventory_item_id INTEGER REFERENCES org_inventory_items(id) ON DELETE SET NULL,
      description VARCHAR(220) NOT NULL,
      quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
      unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
      line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_org_sale_lines_sale ON org_sales_order_lines (sale_id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_purchases (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      vendor_name VARCHAR(160) NOT NULL DEFAULT '',
      reference VARCHAR(120),
      total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
      notes TEXT,
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_org_purchases_org ON org_purchases (organization_id, purchased_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_purchase_lines (
      id SERIAL PRIMARY KEY,
      purchase_id INTEGER NOT NULL REFERENCES org_purchases(id) ON DELETE CASCADE,
      inventory_item_id INTEGER REFERENCES org_inventory_items(id) ON DELETE SET NULL,
      description VARCHAR(220) NOT NULL,
      quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
      unit_cost_cents INTEGER NOT NULL CHECK (unit_cost_cents >= 0),
      line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_org_purchase_lines_p ON org_purchase_lines (purchase_id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_customer_balance_lines (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      customer_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      delta_cents INTEGER NOT NULL,
      kind VARCHAR(24) NOT NULL DEFAULT 'adjustment',
      description VARCHAR(300) NOT NULL DEFAULT '',
      sale_id INTEGER REFERENCES org_sales_orders(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_org_cust_bal_org ON org_customer_balance_lines (organization_id, created_at DESC)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_org_cust_bal_cust ON org_customer_balance_lines (organization_id, customer_user_id)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS org_till_sessions (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      status VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
      opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      closed_at TIMESTAMPTZ,
      opening_float_cents INTEGER NOT NULL DEFAULT 0,
      closing_counted_cents INTEGER,
      notes TEXT,
      closing_notes TEXT,
      opened_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      closed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_org_till_org ON org_till_sessions (organization_id, opened_at DESC)`);
  await pool.query(`ALTER TABLE org_till_sessions ADD COLUMN IF NOT EXISTS closing_notes TEXT`);
}
