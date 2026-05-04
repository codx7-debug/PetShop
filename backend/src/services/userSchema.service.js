import pool from "../config/db.js";

/**
 * Ensures `users` table exists for auth + org approval flow.
 */
export async function initUserSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100),
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(10) NOT NULL DEFAULT 'user',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      org_name VARCHAR(100),
      org_contact VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS org_name VARCHAR(100)
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS org_contact VARCHAR(100)
  `);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(40)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address_region VARCHAR(100)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address_postal VARCHAR(20)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address_country VARCHAR(80)`);
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT true`
  );
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_push BOOLEAN NOT NULL DEFAULT true`
  );
  await pool.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_marketing BOOLEAN NOT NULL DEFAULT false`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_payment_cards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label VARCHAR(80),
      brand VARCHAR(40) NOT NULL DEFAULT 'card',
      last_four VARCHAR(4) NOT NULL,
      holder_name VARCHAR(120),
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
      title VARCHAR(200) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'completed',
      address_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_cards_user ON user_payment_cards (user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_tx_user ON user_transactions (user_id)`);
}
