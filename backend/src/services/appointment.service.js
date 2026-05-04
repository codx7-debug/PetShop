import pool from "../config/db.js";
import { isBlockedByHoliday } from "./holiday.service.js";
import { getPetById } from "./pet.service.js";
import { getActiveServiceWithOrgOwner } from "./serviceCatalog.service.js";

function holidayError() {
  const err = new Error("HOLIDAY_BLOCKED");
  err.code = "HOLIDAY_BLOCKED";
  return err;
}

function badRangeError() {
  const err = new Error("INVALID_TIME_RANGE");
  err.code = "INVALID_TIME_RANGE";
  return err;
}

function petOwnerMismatchError() {
  const err = new Error("PET_OWNER_MISMATCH");
  err.code = "PET_OWNER_MISMATCH";
  return err;
}

function invalidServiceError() {
  const err = new Error("INVALID_SERVICE");
  err.code = "INVALID_SERVICE";
  return err;
}

async function assertPetOwnedBy(petId, ownerUserId) {
  if (petId == null) return;
  const pet = await getPetById(petId);
  if (!pet || pet.owner_user_id !== ownerUserId) throw petOwnerMismatchError();
}

export async function createAppointment({
  clinicStaffUserId,
  petId,
  ownerUserId,
  startsAt,
  endsAt,
  displayTimezone,
  notes,
  reminderChannel,
  serviceId,
}) {
  if (new Date(endsAt) <= new Date(startsAt)) throw badRangeError();
  await assertPetOwnedBy(petId, ownerUserId);

  let staffId = clinicStaffUserId ?? null;
  let svcId = serviceId != null ? Number(serviceId) : null;
  if (svcId != null && !Number.isFinite(svcId)) svcId = null;

  if (svcId != null) {
    const svc = await getActiveServiceWithOrgOwner(svcId);
    if (!svc) throw invalidServiceError();
    if (staffId != null && Number(staffId) !== Number(svc.provider_user_id)) {
      const err = new Error("STAFF_SERVICE_MISMATCH");
      err.code = "STAFF_SERVICE_MISMATCH";
      throw err;
    }
    staffId = svc.provider_user_id;
  }

  const blocked = await isBlockedByHoliday({
    clinicStaffUserId: staffId,
    startsAtIso: startsAt,
    displayTimezone: displayTimezone || "UTC",
  });
  if (blocked) throw holidayError();

  const { rows } = await pool.query(
    `INSERT INTO appointments (
       clinic_staff_user_id, pet_id, owner_user_id, starts_at, ends_at,
       display_timezone, notes, reminder_channel, status, service_id
     ) VALUES ($1,$2,$3,$4::timestamptz,$5::timestamptz,$6,$7,$8,'scheduled',$9)
     RETURNING *`,
    [
      staffId,
      petId ?? null,
      ownerUserId,
      startsAt,
      endsAt,
      displayTimezone || "UTC",
      notes?.trim() || null,
      reminderChannel || "auto",
      svcId,
    ]
  );
  return rows[0];
}

export async function updateAppointment(id, patch) {
  const existing = await getAppointmentById(id);
  if (!existing || existing.status !== "scheduled") return null;

  const nextStart = patch.startsAt != null ? patch.startsAt : existing.starts_at;
  const nextEnd = patch.endsAt != null ? patch.endsAt : existing.ends_at;
  const nextTz = patch.displayTimezone != null ? patch.displayTimezone : existing.display_timezone;
  let nextStaff = patch.clinicStaffUserId !== undefined ? patch.clinicStaffUserId : existing.clinic_staff_user_id;
  let nextServiceId = existing.service_id ?? null;

  if (patch.serviceId !== undefined || patch.service_id !== undefined) {
    const sid = patch.serviceId ?? patch.service_id;
    if (sid == null) {
      nextServiceId = null;
      nextStaff = patch.clinicStaffUserId !== undefined ? patch.clinicStaffUserId : existing.clinic_staff_user_id;
    } else {
      const n = Number(sid);
      if (!Number.isFinite(n)) throw invalidServiceError();
      const svc = await getActiveServiceWithOrgOwner(n);
      if (!svc) throw invalidServiceError();
      if (nextStaff != null && Number(nextStaff) !== Number(svc.provider_user_id)) {
        const err = new Error("STAFF_SERVICE_MISMATCH");
        err.code = "STAFF_SERVICE_MISMATCH";
        throw err;
      }
      nextStaff = svc.provider_user_id;
      nextServiceId = n;
    }
  }

  const nextPet = patch.petId !== undefined ? patch.petId : existing.pet_id;
  const nextOwner = existing.owner_user_id;

  if (new Date(nextEnd) <= new Date(nextStart)) throw badRangeError();
  await assertPetOwnedBy(nextPet, nextOwner);

  if (
    patch.startsAt != null ||
    patch.displayTimezone != null ||
    patch.clinicStaffUserId !== undefined ||
    patch.serviceId !== undefined ||
    patch.service_id !== undefined
  ) {
    const blocked = await isBlockedByHoliday({
      clinicStaffUserId: nextStaff,
      startsAtIso: typeof nextStart === "string" ? nextStart : nextStart.toISOString(),
      displayTimezone: nextTz,
    });
    if (blocked) throw holidayError();
  }

  const fields = [];
  const vals = [];
  let i = 1;
  if (patch.startsAt != null) {
    fields.push(`starts_at = $${i++}::timestamptz`);
    vals.push(patch.startsAt);
  }
  if (patch.endsAt != null) {
    fields.push(`ends_at = $${i++}::timestamptz`);
    vals.push(patch.endsAt);
  }
  if (patch.displayTimezone != null) {
    fields.push(`display_timezone = $${i++}`);
    vals.push(patch.displayTimezone);
  }
  if (patch.notes !== undefined) {
    fields.push(`notes = $${i++}`);
    vals.push(patch.notes);
  }
  if (patch.reminderChannel != null) {
    fields.push(`reminder_channel = $${i++}`);
    vals.push(patch.reminderChannel);
  }
  if (patch.petId !== undefined) {
    fields.push(`pet_id = $${i++}`);
    vals.push(patch.petId);
  }
  if (patch.serviceId !== undefined || patch.service_id !== undefined) {
    fields.push(`service_id = $${i++}`);
    vals.push(nextServiceId);
    fields.push(`clinic_staff_user_id = $${i++}`);
    vals.push(nextStaff);
  } else if (patch.clinicStaffUserId !== undefined) {
    fields.push(`clinic_staff_user_id = $${i++}`);
    vals.push(patch.clinicStaffUserId);
  }
  if (!fields.length) return existing;

  fields.push(`updated_at = NOW()`);
  vals.push(id);
  const { rows } = await pool.query(
    `UPDATE appointments SET ${fields.join(", ")} WHERE id = $${i} AND status = 'scheduled' RETURNING *`,
    vals
  );
  return rows[0] || null;
}

export async function cancelAppointment(id) {
  const { rows } = await pool.query(
    `UPDATE appointments
     SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'scheduled'
     RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

export async function getAppointmentById(id) {
  const { rows } = await pool.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
  return rows[0] || null;
}

/**
 * Calendar range: overlaps [fromIso, toIso]; joins pet for UI.
 */
export async function listAppointmentsInRange({ fromIso, toIso, clinicStaffUserId }) {
  let q = `
    SELECT a.*,
           p.name AS pet_name,
           p.species AS pet_species,
           p.owner_phone AS pet_owner_phone,
           p.reminder_preference AS pet_reminder_preference
    FROM appointments a
    LEFT JOIN pets p ON p.id = a.pet_id
    WHERE a.starts_at < $2::timestamptz
      AND a.ends_at > $1::timestamptz
      AND a.status <> 'cancelled'
  `;
  const params = [fromIso, toIso];
  if (clinicStaffUserId != null && clinicStaffUserId !== "") {
    q += ` AND a.clinic_staff_user_id = $3`;
    params.push(clinicStaffUserId);
  }
  q += ` ORDER BY a.starts_at`;
  const { rows } = await pool.query(q, params);
  return rows;
}

/**
 * Provider calendar: same range filter, always scoped to one staff (org owner) user id,
 * includes booked service title and organization display name for dashboards.
 */
export async function listProviderAppointmentsDetailed({ fromIso, toIso, clinicStaffUserId }) {
  const staffId = Number(clinicStaffUserId);
  if (!Number.isFinite(staffId)) {
    return [];
  }
  const q = `
    SELECT a.*,
           p.name AS pet_name,
           p.species AS pet_species,
           p.owner_phone AS pet_owner_phone,
           p.reminder_preference AS pet_reminder_preference,
           s.title AS service_title,
           o.display_name AS provider_org_name,
           o.org_type AS provider_org_type
    FROM appointments a
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN organizations o ON o.id = s.organization_id
    WHERE a.starts_at < $2::timestamptz
      AND a.ends_at > $1::timestamptz
      AND a.status <> 'cancelled'
      AND a.clinic_staff_user_id = $3
    ORDER BY a.starts_at
  `;
  const { rows } = await pool.query(q, [fromIso, toIso, staffId]);
  return rows;
}

/** Appointments needing reminder dispatch (24h or 2h window). */
export async function listAppointmentsForReminder(kind) {
  if (kind === "24h") {
    const { rows } = await pool.query(
      `SELECT a.*, p.name AS pet_name, p.owner_phone, p.reminder_preference, p.whatsapp_opt_in
       FROM appointments a
       LEFT JOIN pets p ON p.id = a.pet_id
       WHERE a.status = 'scheduled'
         AND a.reminder_24h_sent_at IS NULL
         AND a.starts_at > NOW() + INTERVAL '23.4 hours'
         AND a.starts_at <= NOW() + INTERVAL '24.6 hours'`
    );
    return rows;
  }
  if (kind === "2h") {
    const { rows } = await pool.query(
      `SELECT a.*, p.name AS pet_name, p.owner_phone, p.reminder_preference, p.whatsapp_opt_in
       FROM appointments a
       LEFT JOIN pets p ON p.id = a.pet_id
       WHERE a.status = 'scheduled'
         AND a.reminder_2h_sent_at IS NULL
         AND a.starts_at > NOW() + INTERVAL '1.4 hours'
         AND a.starts_at <= NOW() + INTERVAL '2.6 hours'`
    );
    return rows;
  }
  return [];
}

export async function markReminderSent(id, kind) {
  if (kind === "24h") {
    await pool.query(
      `UPDATE appointments SET reminder_24h_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  } else if (kind === "2h") {
    await pool.query(
      `UPDATE appointments SET reminder_2h_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }
}

export async function logReminder({ appointmentId, channel, kind, toAddress, body, providerStatus }) {
  await pool.query(
    `INSERT INTO reminder_logs (appointment_id, channel, kind, to_address, body, provider_status)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [appointmentId, channel, kind, toAddress || null, body || null, providerStatus || null]
  );
}
