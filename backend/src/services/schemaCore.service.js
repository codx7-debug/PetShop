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
  `CREATE TABLE IF NOT EXISTS user_org_favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, organization_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_org ON user_org_favorites (organization_id)`,
  `CREATE TABLE IF NOT EXISTS user_org_recent (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, organization_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_recent_user ON user_org_recent (user_id, viewed_at DESC)`,
  `CREATE TABLE IF NOT EXISTS organization_reviews (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL,
    title VARCHAR(200),
    body TEXT,
    photo_urls TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_org ON organization_reviews (organization_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS service_packages (
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
  `CREATE TABLE IF NOT EXISTS service_package_items (
    package_id INTEGER NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (package_id, service_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_packages_org ON service_packages (organization_id)`,
  `CREATE TABLE IF NOT EXISTS organization_members (
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_org VARCHAR(32) NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members (user_id)`,
  `CREATE TABLE IF NOT EXISTS org_inventory_items (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku VARCHAR(80),
    name VARCHAR(200) NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit VARCHAR(40) DEFAULT 'unit',
    low_stock_threshold NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_org ON org_inventory_items (organization_id)`,
  `CREATE TABLE IF NOT EXISTS appointment_waitlist (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    display_timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
    status VARCHAR(24) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, owner_user_id, service_id, starts_at)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_waitlist_org ON appointment_waitlist (organization_id, status)`,
  `CREATE TABLE IF NOT EXISTS org_broadcasts (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(40) NOT NULL DEFAULT 'general',
    title VARCHAR(240) NOT NULL,
    body TEXT,
    metadata_json TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_notifications ON user_notifications (user_id, created_at DESC)`,
];

export async function initCoreSchema() {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
}
