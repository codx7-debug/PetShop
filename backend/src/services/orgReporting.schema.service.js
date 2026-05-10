import pool from "../config/db.js";

export async function initOrgReportingSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_leave_requests (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      status VARCHAR(24) NOT NULL DEFAULT 'pending',
      reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      review_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_staff_leave_org ON staff_leave_requests (organization_id, created_at DESC)`
  );
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_staff_leave_status ON staff_leave_requests (organization_id, status)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pet_weight_entries (
      id SERIAL PRIMARY KEY,
      pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      weight_kg NUMERIC(10,3) NOT NULL CHECK (weight_kg > 0),
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notes TEXT,
      recorded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_pet_weight_pet ON pet_weight_entries (pet_id, recorded_at DESC)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_pet_weight_org ON pet_weight_entries (organization_id, recorded_at DESC)`
  );
}
