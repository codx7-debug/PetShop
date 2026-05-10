import pool from "../config/db.js";

/** Visitors, interviews (notes), vaccinations, lodging — runs after core + appointments + pets exist. */
export async function initFacilitySchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitor_registrations (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      visitor_name VARCHAR(120) NOT NULL,
      phone VARCHAR(40),
      email VARCHAR(120),
      purpose VARCHAR(200),
      notes TEXT,
      checked_in_at TIMESTAMPTZ DEFAULT NOW(),
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_visitor_registrations_org_checked ON visitor_registrations (organization_id, checked_in_at DESC)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interview_logs (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      interviewer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      subject_name VARCHAR(120) NOT NULL,
      subject_phone VARCHAR(40),
      summary TEXT NOT NULL DEFAULT '',
      recording_uri TEXT,
      category VARCHAR(80) DEFAULT 'general',
      interviewed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_interview_logs_org ON interview_logs (organization_id, interviewed_at DESC)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pet_vaccinations (
      id SERIAL PRIMARY KEY,
      pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      vaccine_name VARCHAR(160) NOT NULL,
      administered_on DATE NOT NULL,
      next_due_on DATE,
      batch_number VARCHAR(80),
      notes TEXT,
      recorded_by_org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_pet ON pet_vaccinations (pet_id)`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_org ON pet_vaccinations (recorded_by_org_id) WHERE recorded_by_org_id IS NOT NULL`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accommodation_units (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      label VARCHAR(80) NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true
    )
  `);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_accommodation_units_org_label ON accommodation_units (organization_id, label)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accommodation_stays (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      unit_id INTEGER REFERENCES accommodation_units(id) ON DELETE SET NULL,
      pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
      guest_name VARCHAR(120),
      owner_phone VARCHAR(40),
      check_in_date DATE NOT NULL,
      check_out_date DATE NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'booked',
      notes TEXT,
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT chk_stay_dates CHECK (check_out_date >= check_in_date)
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_accommodation_stays_org_in ON accommodation_stays (organization_id, check_in_date)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pet_documents (
      id SERIAL PRIMARY KEY,
      pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      file_url TEXT NOT NULL,
      notes TEXT,
      uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pet_documents_pet ON pet_documents (pet_id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_documents (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      customer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      file_url TEXT NOT NULL,
      notes TEXT,
      uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_customer_documents_org_user ON customer_documents (organization_id, customer_user_id)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inspection_records (
      id SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
      appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
      title VARCHAR(200) NOT NULL DEFAULT 'Inspection',
      findings TEXT NOT NULL DEFAULT '',
      status VARCHAR(40) DEFAULT 'completed',
      inspected_at TIMESTAMPTZ DEFAULT NOW(),
      inspected_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_inspections_org ON inspection_records (organization_id, inspected_at DESC)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS communication_consents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
      channel VARCHAR(40) NOT NULL DEFAULT 'commercial',
      opted_in BOOLEAN NOT NULL DEFAULT false,
      source VARCHAR(80) DEFAULT 'in_app',
      notes TEXT,
      recorded_at TIMESTAMPTZ DEFAULT NOW(),
      recorded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_comm_consents_user ON communication_consents (user_id, recorded_at DESC)`);
}
