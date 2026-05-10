import pool from "../config/db.js";
import { getPetById } from "./pet.service.js";

export async function listVisitors(orgId, { limit = 80 } = {}) {
  const lim = Math.min(200, Math.max(1, Number(limit) || 80));
  const { rows } = await pool.query(
    `SELECT * FROM visitor_registrations
     WHERE organization_id = $1
     ORDER BY checked_in_at DESC
     LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function createVisitor(orgId, userId, body) {
  const name = String(body?.visitor_name || body?.name || "").trim();
  if (!name) {
    const e = new Error("VISITOR_NAME_REQUIRED");
    e.code = "VISITOR_NAME_REQUIRED";
    throw e;
  }
  const { rows } = await pool.query(
    `INSERT INTO visitor_registrations (
       organization_id, visitor_name, phone, email, purpose, notes, created_by_user_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      orgId,
      name,
      body?.phone?.trim() || null,
      body?.email?.trim() || null,
      body?.purpose?.trim() || null,
      body?.notes?.trim() || null,
      Number.isFinite(Number(userId)) ? Number(userId) : null,
    ]
  );
  return rows[0];
}

export async function listInterviewLogs(orgId, { limit = 60 } = {}) {
  const lim = Math.min(200, Math.max(1, Number(limit) || 60));
  const { rows } = await pool.query(
    `SELECT * FROM interview_logs
     WHERE organization_id = $1
     ORDER BY interviewed_at DESC
     LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function createInterviewLog(orgId, userId, body) {
  const subject = String(body?.subject_name || "").trim();
  if (!subject) {
    const e = new Error("SUBJECT_REQUIRED");
    e.code = "SUBJECT_REQUIRED";
    throw e;
  }
  const summary = String(body?.summary ?? body?.recording_notes ?? "").trim();
  if (!summary && !body?.recording_uri?.trim()) {
    const e = new Error("SUMMARY_OR_URI_REQUIRED");
    e.code = "SUMMARY_OR_URI_REQUIRED";
    throw e;
  }
  const { rows } = await pool.query(
    `INSERT INTO interview_logs (
       organization_id, interviewer_user_id, subject_name, subject_phone, summary,
       recording_uri, category
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      orgId,
      Number.isFinite(Number(userId)) ? Number(userId) : null,
      subject,
      body?.subject_phone?.trim() || null,
      summary || "",
      body?.recording_uri?.trim() || null,
      String(body?.category || "general").trim().slice(0, 80) || "general",
    ]
  );
  return rows[0];
}

export async function listAccommodationUnits(orgId) {
  const { rows } = await pool.query(
    `SELECT * FROM accommodation_units WHERE organization_id = $1 ORDER BY label`,
    [orgId]
  );
  return rows;
}

export async function createAccommodationUnit(orgId, body) {
  const label = String(body?.label || "").trim();
  if (!label) {
    const e = new Error("UNIT_LABEL_REQUIRED");
    e.code = "UNIT_LABEL_REQUIRED";
    throw e;
  }
  const capacity = Math.max(1, Math.floor(Number(body?.capacity) || 1));
  try {
    const { rows } = await pool.query(
      `INSERT INTO accommodation_units (organization_id, label, capacity, is_active)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [orgId, label, capacity, body?.is_active !== false]
    );
    return rows[0];
  } catch (e) {
    if (e.code === "23505") return null;
    throw e;
  }
}

export async function patchAccommodationUnit(orgId, unitId, body) {
  const id = Number(unitId);
  if (!Number.isFinite(id)) return null;
  const label = body?.label != null ? String(body.label).trim() : null;
  const capacity =
    body?.capacity != null ? Math.max(1, Math.floor(Number(body.capacity) || 1)) : null;
  const fields = [];
  const vals = [];
  if (label) {
    fields.push(`label = $${vals.length + 1}`);
    vals.push(label);
  }
  if (capacity != null) {
    fields.push(`capacity = $${vals.length + 1}`);
    vals.push(capacity);
  }
  if (body?.is_active !== undefined) {
    fields.push(`is_active = $${vals.length + 1}`);
    vals.push(Boolean(body.is_active));
  }
  if (!fields.length) return null;
  vals.push(id, orgId);
  const n = vals.length;
  const { rows } = await pool.query(
    `UPDATE accommodation_units SET ${fields.join(", ")}
     WHERE id = $${n - 1} AND organization_id = $${n}
     RETURNING *`,
    vals
  );
  return rows[0] || null;
}

export async function listAccommodationStays(orgId, { fromDate, toDate } = {}) {
  let q = `SELECT * FROM accommodation_stays WHERE organization_id = $1`;
  const p = [orgId];
  if (fromDate && toDate) {
    p.push(fromDate, toDate);
    q += ` AND check_in_date <= $3::date AND check_out_date >= $2::date`;
  }
  q += ` ORDER BY check_in_date DESC, id DESC`;
  const { rows } = await pool.query(q, p);
  return rows;
}

export async function createAccommodationStay(orgId, userId, body) {
  const checkIn = String(body?.check_in_date || body?.checkIn || "").trim();
  const checkOut = String(body?.check_out_date || body?.checkOut || "").trim();
  if (!checkIn || !checkOut) {
    const e = new Error("DATES_REQUIRED");
    e.code = "DATES_REQUIRED";
    throw e;
  }
  const pid = body?.pet_id != null ? Number(body.pet_id) : null;
  const uid = Number.isFinite(Number(pid)) ? Number(pid) : null;
  const guest = String(body?.guest_name || "").trim() || null;
  if (!uid && !guest) {
    const e = new Error("PET_OR_GUEST_REQUIRED");
    e.code = "PET_OR_GUEST_REQUIRED";
    throw e;
  }
  const { rows } = await pool.query(
    `INSERT INTO accommodation_stays (
       organization_id, unit_id, pet_id, guest_name, owner_phone,
       check_in_date, check_out_date, status, notes, created_by_user_id
     ) VALUES ($1,$2,$3,$4,$5,$6::date,$7::date,$8,$9,$10)
     RETURNING *`,
    [
      orgId,
      Number.isFinite(Number(body?.unit_id)) ? Number(body.unit_id) : null,
      uid,
      guest,
      body?.owner_phone?.trim() || null,
      checkIn,
      checkOut,
      String(body?.status || "booked").trim().slice(0, 24) || "booked",
      body?.notes?.trim() || null,
      Number.isFinite(Number(userId)) ? Number(userId) : null,
    ]
  );
  return rows[0];
}

export async function updateAccommodationStayStatus(orgId, stayId, status) {
  const st = String(status || "").trim().slice(0, 24);
  if (!st) return null;
  const { rows } = await pool.query(
    `UPDATE accommodation_stays SET status = $3
     WHERE id = $2 AND organization_id = $1
     RETURNING *`,
    [orgId, stayId, st]
  );
  return rows[0] || null;
}

/** Owner: vaccinations for owned pet only. */
export async function listVaccinationsForPet(petId, ownerUserId) {
  const pet = await getPetById(petId);
  if (!pet || Number(pet.owner_user_id) !== Number(ownerUserId)) return null;
  const { rows } = await pool.query(
    `SELECT * FROM pet_vaccinations WHERE pet_id = $1 ORDER BY administered_on DESC`,
    [petId]
  );
  return rows;
}

export async function addVaccinationForPet({ petId, ownerUserId = null, orgId = null, body }) {
  const pet = await getPetById(petId);
  if (!pet) {
    const e = new Error("PET_NOT_FOUND");
    e.code = "PET_NOT_FOUND";
    throw e;
  }
  if (ownerUserId != null && Number(pet.owner_user_id) !== Number(ownerUserId)) {
    const e = new Error("PET_FORBIDDEN");
    e.code = "PET_FORBIDDEN";
    throw e;
  }
  const recorder =
    orgId != null && Number(orgId) > 0 ? Number(orgId) : null;
  return insertVaccinationRow(petId, recorder, body);
}

async function insertVaccinationRow(petId, recordedByOrgId, body) {
  const name = String(body?.vaccine_name || "").trim();
  const admin = String(body?.administered_on || body?.administered_date || "").trim().slice(0, 16);
  if (!name || !admin) {
    const e = new Error("VACC_FIELDS");
    e.code = "VACC_FIELDS";
    throw e;
  }
  const nextDue = body?.next_due_on ? String(body.next_due_on).trim().slice(0, 16) : null;
  const batch = body?.batch_number?.trim() || null;
  const notes = body?.notes?.trim() || null;
  const { rows } = await pool.query(
    `INSERT INTO pet_vaccinations (
       pet_id, vaccine_name, administered_on, next_due_on, batch_number, notes, recorded_by_org_id
     ) VALUES ($1,$2,$3::date,$4::date,$5,$6,$7)
     RETURNING *`,
    [petId, name, admin, nextDue || null, batch, notes, recordedByOrgId]
  );
  return rows[0];
}

export async function deleteVaccinationForPetOwner(vaccinationId, ownerUserId) {
  const { rows } = await pool.query(
    `DELETE FROM pet_vaccinations v USING pets p
     WHERE v.id = $1 AND v.pet_id = p.id AND p.owner_user_id = $2
     RETURNING v.id`,
    [vaccinationId, ownerUserId]
  );
  return rows[0]?.id ?? null;
}

export async function deleteVaccinationForOrg(vaccinationId, orgId) {
  const { rows } = await pool.query(
    `DELETE FROM pet_vaccinations
     WHERE id = $1 AND recorded_by_org_id = $2
     RETURNING id`,
    [vaccinationId, orgId]
  );
  return rows[0]?.id ?? null;
}

export async function listVaccinationsByOrg(orgId, { limit = 100 } = {}) {
  const lim = Math.min(300, Math.max(1, Number(limit) || 100));
  const { rows } = await pool.query(
    `SELECT v.*, p.name AS pet_name, p.owner_user_id
     FROM pet_vaccinations v
     JOIN pets p ON p.id = v.pet_id
     WHERE v.recorded_by_org_id = $1
     ORDER BY v.administered_on DESC NULLS LAST, v.created_at DESC
     LIMIT $2`,
    [orgId, lim]
  );
  return rows;
}

export async function recordOrgVaccination(orgId, petId, body) {
  const pet = await getPetById(petId);
  if (!pet) {
    const e = new Error("PET_NOT_FOUND");
    e.code = "PET_NOT_FOUND";
    throw e;
  }
  return await insertVaccinationRow(petId, orgId, body);
}
