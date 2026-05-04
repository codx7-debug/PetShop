// User schema definition for roles: normal user & org user

const userTableName = 'users';

// ─── Create Table ─────────────────────────────────────────────────────────────
// Run once during DB initialization or via a migration tool.
const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${userTableName} (
  id           SERIAL PRIMARY KEY,
  full_name    VARCHAR(100),
  email        VARCHAR(100) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(10)  NOT NULL DEFAULT 'user',
  status       VARCHAR(20)  NOT NULL DEFAULT 'active',
  org_name     VARCHAR(100),
  org_contact  VARCHAR(100),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// ─── Migration: Add status to existing table ──────────────────────────────────
// Safe to run even if the column already exists (IF NOT EXISTS).
const addStatusColumnSQL = `
ALTER TABLE ${userTableName}
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
`;

// ─── Seed org accounts as 'pending' (run after migration if needed) ───────────
const backfillOrgStatusSQL = `
UPDATE ${userTableName}
SET status = 'pending'
WHERE role = 'org' AND status = 'active';
`;

module.exports = {
  userTableName,
  createTableSQL,
  addStatusColumnSQL,
  backfillOrgStatusSQL,
};