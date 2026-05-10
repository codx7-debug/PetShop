import pool from "../config/db.js";
import { getPetById } from "./pet.service.js";

export async function orgHasSeenPet(orgId, petId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM appointments a
     JOIN services s ON s.id = a.service_id
     WHERE a.pet_id = $1 AND s.organization_id = $2 AND a.status <> 'cancelled'
     LIMIT 1`,
    [petId, orgId]
  );
  return rows.length > 0;
}

/** Pets that appear on this org calendar (appointment owners). */
export async function listOrgPatients(orgId, { limit = 150 } = {}) {
  const lim = Math.min(400, Math.max(1, Number(limit) || 150));
  const { rows } = await pool.query(
    `SELECT
        p.id AS pet_id,
        p.name AS pet_name,
        p.species,
        p.breed,
        p.owner_user_id,
        owner.full_name AS owner_name,
        owner.email AS owner_email,
        owner.phone AS owner_phone,
        MAX(a.starts_at) AS last_appointment_at
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN pets p ON p.id = a.pet_id
     JOIN users owner ON owner.id = p.owner_user_id
     WHERE s.organization_id = $1 AND a.pet_id IS NOT NULL AND a.status <> 'cancelled'
     GROUP BY p.id, p.name, p.species, p.breed, p.owner_user_id, owner.full_name, owner.email, owner.phone
     ORDER BY last_appointment_at DESC NULLS LAST
     LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

/** Customers (pet parents) who booked this org at least once. */
export async function listOrgCustomers(orgId, { limit = 150 } = {}) {
  const lim = Math.min(400, Math.max(1, Number(limit) || 150));
  const { rows } = await pool.query(
    `SELECT
        u.id AS customer_user_id,
        u.full_name,
        u.email,
        u.phone,
        COUNT(a.id)::int AS appointment_count,
        MAX(a.starts_at) AS last_booking_at
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN users u ON u.id = a.owner_user_id
     WHERE s.organization_id = $1 AND a.status <> 'cancelled'
     GROUP BY u.id, u.full_name, u.email, u.phone
     ORDER BY last_booking_at DESC NULLS LAST
     LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function listPetDocuments({ petId, orgId = null, ownerUserId = null }) {
  if (ownerUserId != null) {
    const pet = await getPetById(petId);
    if (!pet || Number(pet.owner_user_id) !== Number(ownerUserId)) return null;
    const { rows } = await pool.query(
      `SELECT * FROM pet_documents WHERE pet_id = $1 ORDER BY created_at DESC`,
      [petId]
    );
    return rows;
  }
  const ok = await orgHasSeenPet(orgId, petId);
  if (!ok) return [];
  const { rows } = await pool.query(
    `SELECT * FROM pet_documents WHERE pet_id = $1 ORDER BY created_at DESC`,
    [petId]
  );
  return rows;
}

export async function addPetDocument({
  petId,
  title,
  fileUrl,
  notes,
  uploadedByUserId,
  organizationId = null,
  ownerUserIdAssert = null,
}) {
  if (ownerUserIdAssert != null) {
    const pet = await getPetById(petId);
    if (!pet || Number(pet.owner_user_id) !== Number(ownerUserIdAssert)) {
      const e = new Error("PET_ACCESS");
      e.code = "PET_ACCESS";
      throw e;
    }
  }
  const tid = String(title || "").trim();
  const url = String(fileUrl || "").trim();
  if (!tid || !url) {
    const e = new Error("DOC_FIELDS");
    e.code = "DOC_FIELDS";
    throw e;
  }
  const { rows } = await pool.query(
    `INSERT INTO pet_documents (pet_id, organization_id, title, file_url, notes, uploaded_by_user_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      petId,
      organizationId,
      tid,
      url,
      notes?.trim() || null,
      uploadedByUserId != null ? Number(uploadedByUserId) : null,
    ]
  );
  return rows[0];
}

export async function listCustomerDocuments(orgId, customerUserId) {
  const cid = Number(customerUserId);
  if (!Number.isFinite(cid)) return [];
  const { rows } = await pool.query(
    `SELECT * FROM customer_documents
     WHERE organization_id = $1 AND customer_user_id = $2
     ORDER BY created_at DESC`,
    [orgId, cid]
  );
  return rows;
}

export async function addCustomerDocument({
  organizationId,
  customerUserId,
  title,
  fileUrl,
  notes,
  uploadedByUserId,
}) {
  const tid = String(title || "").trim();
  const url = String(fileUrl || "").trim();
  if (!tid || !url) {
    const e = new Error("DOC_FIELDS");
    e.code = "DOC_FIELDS";
    throw e;
  }
  const { rows } = await pool.query(
    `INSERT INTO customer_documents (
       organization_id, customer_user_id, title, file_url, notes, uploaded_by_user_id
     ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [organizationId, customerUserId, tid, url, notes?.trim() || null, uploadedByUserId]
  );
  return rows[0];
}

export async function assertOrgKnowsCustomer(orgId, customerUserId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM appointments a
     JOIN services s ON s.id = a.service_id
     WHERE a.owner_user_id = $1 AND s.organization_id = $2 AND a.status <> 'cancelled'
     LIMIT 1`,
    [customerUserId, orgId]
  );
  return rows.length > 0;
}

export async function listInspections(orgId, { limit = 80 } = {}) {
  const lim = Math.min(200, Math.max(1, Number(limit) || 80));
  const { rows } = await pool.query(
    `SELECT * FROM inspection_records
     WHERE organization_id = $1
     ORDER BY inspected_at DESC
     LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function addInspection(orgId, userId, body) {
  const title = String(body?.title || "Inspection").trim().slice(0, 200) || "Inspection";
  const findings = String(body?.findings ?? "").trim();
  const pid = body?.pet_id != null ? Number(body.pet_id) : null;
  const aid = body?.appointment_id != null ? Number(body.appointment_id) : null;
  if (!findings && !pid && !aid) {
    const e = new Error("INSPECTION_NEEDS_PAYLOAD");
    e.code = "INSPECTION_NEEDS_PAYLOAD";
    throw e;
  }
  let petOk = pid == null;
  if (!petOk && Number.isFinite(pid)) petOk = await orgHasSeenPet(orgId, pid);
  if (!petOk) {
    const e = new Error("PET_ACCESS");
    e.code = "PET_ACCESS";
    throw e;
  }
  const { rows } = await pool.query(
    `INSERT INTO inspection_records (
       organization_id, pet_id, appointment_id, title, findings, status, inspected_by_user_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      orgId,
      Number.isFinite(pid) ? pid : null,
      Number.isFinite(aid) ? aid : null,
      title,
      findings || "",
      String(body?.status || "completed").trim().slice(0, 40) || "completed",
      Number.isFinite(Number(userId)) ? Number(userId) : null,
    ]
  );
  return rows[0];
}

/** Consent ledger rows for users linked to this org (bookings) or stamped for this org. */
export async function listConsentEventsForOrgCustomers(orgId, { limit = 120 } = {}) {
  const lim = Math.min(300, Math.max(1, Number(limit) || 120));
  const { rows } = await pool.query(
    `SELECT c.*, u.email AS user_email, u.full_name AS user_full_name
     FROM communication_consents c
     JOIN users u ON u.id = c.user_id
     WHERE (
       c.organization_id = $1 OR
       EXISTS (
         SELECT 1 FROM appointments a
         JOIN services s ON s.id = a.service_id
         WHERE a.owner_user_id = c.user_id AND s.organization_id = $1 LIMIT 1
       )
     )
     ORDER BY c.recorded_at DESC
     LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function recordConsent({
  userId,
  organizationId,
  optedIn,
  channel = "commercial",
  source = "in_app",
  notes,
  recordedByUserId,
}) {
  const { rows } = await pool.query(
    `INSERT INTO communication_consents (
       user_id, organization_id, channel, opted_in, source, notes, recorded_by_user_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      userId,
      organizationId,
      String(channel || "commercial").slice(0, 40),
      Boolean(optedIn),
      String(source || "in_app").slice(0, 80),
      notes?.trim() || null,
      recordedByUserId != null ? Number(recordedByUserId) : null,
    ]
  );
  return rows[0];
}
