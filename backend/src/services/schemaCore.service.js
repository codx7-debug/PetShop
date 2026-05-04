import pool from "../config/db.js";

/**
 * Organizations, catalog services, injury reports; links appointments → services.
 * Run after users + appointment tables exist.
 */
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(200) NOT NULL,
    org_type VARCHAR(40) NOT NULL DEFAULT 'vet',
    description TEXT,
    address_line TEXT,
    city VARCHAR(100),
    country VARCHAR(80),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (owner_user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    price_cents INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200),
    description TEXT NOT NULL,
    photo_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address_text TEXT,
    status VARCHAR(24) NOT NULL DEFAULT 'open',
    assigned_organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES services(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_services_org ON services (organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_user ON reports (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_assigned_org ON reports (assigned_organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments (service_id)`,
  `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS rating_average REAL`,
  `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gallery_json TEXT`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS public_summary TEXT`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS target_organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_reports_target_org ON reports (target_organization_id)`,
];

export async function initCoreSchema() {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
}
