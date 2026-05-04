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
}
