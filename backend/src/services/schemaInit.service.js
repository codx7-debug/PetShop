/**
 * Creates appointment / pet / holiday tables if they do not exist.
 * Safe to run on every server start (idempotent).
 */
import pool from "../config/db.js";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    owner_user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(80),
    breed VARCHAR(80),
    notes TEXT,
    owner_phone VARCHAR(40),
    whatsapp_opt_in BOOLEAN DEFAULT false,
    reminder_preference VARCHAR(16) NOT NULL DEFAULT 'auto',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS clinic_holidays (
    id SERIAL PRIMARY KEY,
    clinic_staff_user_id INTEGER,
    holiday_date DATE NOT NULL,
    title VARCHAR(160) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    clinic_staff_user_id INTEGER,
    pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
    owner_user_id INTEGER NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    display_timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    reminder_channel VARCHAR(16) NOT NULL DEFAULT 'auto',
    reminder_24h_sent_at TIMESTAMPTZ,
    reminder_2h_sent_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS reminder_logs (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    channel VARCHAR(16) NOT NULL,
    kind VARCHAR(8) NOT NULL,
    to_address VARCHAR(64),
    body TEXT,
    provider_status VARCHAR(80),
    sent_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_starts ON appointments (starts_at) WHERE status = 'scheduled'`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments (clinic_staff_user_id, starts_at)`,
  `CREATE INDEX IF NOT EXISTS idx_holidays_date ON clinic_holidays (holiday_date)`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_cents INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS no_show_fee_cents INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS no_show_marked_at TIMESTAMPTZ`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_group UUID`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS package_id INTEGER`,
];

export async function initAppointmentSchema() {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
}
