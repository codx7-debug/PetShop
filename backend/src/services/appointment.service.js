import { randomUUID } from "crypto";
import pool from "../config/db.js";
import { isBlockedByHoliday } from "./holiday.service.js";
import { getPetById } from "./pet.service.js";
import { getActiveServiceWithOrgOwner } from "./serviceCatalog.service.js";
import { getBookablePackage } from "./servicePackage.service.js";
import { isUserBookableForOrg } from "./organizationMember.service.js";

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

function slotUnavailableError() {
  const err = new Error("SLOT_UNAVAILABLE");
  err.code = "SLOT_UNAVAILABLE";
  return err;
}

async function hasStaffOverlap({ staffUserId, startsAt, endsAt, excludeAppointmentId = null }) {
  const sid = Number(staffUserId);
  if (!Number.isFinite(sid)) return false;
  const { rows } = await pool.query(
    `SELECT id FROM appointments
     WHERE clinic_staff_user_id = $1 AND status = 'scheduled'
       AND starts_at < $3::timestamptz AND ends_at > $2::timestamptz
       AND ($4::integer IS NULL OR id <> $4)
     LIMIT 1`,
    [sid, startsAt, endsAt, excludeAppointmentId != null ? Number(excludeAppointmentId) : null]
  );
  return Boolean(rows[0]);
}

async function insertAppointmentRow(client, vals) {
  const { rows } = await client.query(
    `INSERT INTO appointments (
       clinic_staff_user_id, pet_id, owner_user_id, starts_at, ends_at,
       display_timezone, notes, reminder_channel, status, service_id,
       deposit_cents, no_show_fee_cents, recurrence_group, package_id
     ) VALUES ($1,$2,$3,$4::timestamptz,$5::timestamptz,$6,$7,$8,'scheduled',$9,$10,$11,$12,$13)
     RETURNING *`,
    vals
  );
  return rows[0];
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
  packageId,
  package_id,
  depositCents,
  deposit_cents,
  noShowFeeCents,
  no_show_fee_cents,
  recurrence,
}) {
  if (recurrence?.frequency === "weekly" && Number(recurrence?.count) > 1) {
    return createRecurringWeeklySeries({
      clinicStaffUserId,
      petId,
      ownerUserId,
      startsAt,
      endsAt,
      displayTimezone,
      notes,
      reminderChannel,
      serviceId,
      packageId,
      depositCents: depositCents ?? deposit_cents,
      noShowFeeCents: noShowFeeCents ?? no_show_fee_cents,
      count: recurrence.count,
    });
  }

  if (new Date(endsAt) <= new Date(startsAt)) throw badRangeError();
  await assertPetOwnedBy(petId, ownerUserId);

  const dep =
    depositCents != null
      ? Number(depositCents)
      : deposit_cents != null
        ? Number(deposit_cents)
        : 0;
  const ns =
    noShowFeeCents != null
      ? Number(noShowFeeCents)
      : no_show_fee_cents != null
        ? Number(no_show_fee_cents)
        : 0;

  let staffId = clinicStaffUserId ?? null;
  let svcId = serviceId != null ? Number(serviceId) : null;
  if (svcId != null && !Number.isFinite(svcId)) svcId = null;
  let pkgId = packageId != null ? Number(packageId) : package_id != null ? Number(package_id) : null;
  if (pkgId != null && !Number.isFinite(pkgId)) pkgId = null;

  if (pkgId != null && svcId == null) {
    const pkg = await getBookablePackage(pkgId);
    if (!pkg || !pkg.items?.length) throw invalidServiceError();
    svcId = Number(pkg.items[0].service_id);
    const durMs = Number(pkg.duration_minutes || 60) * 60 * 1000;
    endsAt = new Date(new Date(startsAt).getTime() + durMs).toISOString();
    if (!Number.isFinite(svcId)) throw invalidServiceError();
  }

  if (svcId != null) {
    const svc = await getActiveServiceWithOrgOwner(svcId);
    if (!svc) throw invalidServiceError();
    const orgOid = Number(svc.organization_id);
    const providerOwner = Number(svc.provider_user_id);
    const chosen = staffId != null ? Number(staffId) : providerOwner;
    if (!(await isUserBookableForOrg(chosen, orgOid, providerOwner))) {
      const err = new Error("STAFF_SERVICE_MISMATCH");
      err.code = "STAFF_SERVICE_MISMATCH";
      throw err;
    }
    staffId = chosen;
    if (!pkgId) pkgId = null;
  }

  const blocked = await isBlockedByHoliday({
    clinicStaffUserId: staffId,
    startsAtIso: startsAt,
    displayTimezone: displayTimezone || "UTC",
  });
  if (blocked) throw holidayError();

  if (staffId != null && (await hasStaffOverlap({ staffUserId: staffId, startsAt, endsAt }))) {
    throw slotUnavailableError();
  }

  const row = await insertAppointmentRow(pool, [
    staffId,
    petId ?? null,
    ownerUserId,
    startsAt,
    endsAt,
    displayTimezone || "UTC",
    notes?.trim() || null,
    reminderChannel || "auto",
    svcId,
    Number.isFinite(dep) ? Math.max(0, Math.floor(dep)) : 0,
    Number.isFinite(ns) ? Math.max(0, Math.floor(ns)) : 0,
    null,
    pkgId || null,
  ]);
  return row;
}

async function createRecurringWeeklySeries(args) {
  const n = Math.min(52, Math.max(1, Math.floor(Number(args.count) || 1)));
  const client = await pool.connect();
  const group = randomUUID();
  await assertPetOwnedBy(args.petId, args.ownerUserId);

  try {
    await client.query("BEGIN");
    const rows = [];
    let startMs = new Date(args.startsAt).getTime();
    let endMs = new Date(args.endsAt).getTime();
    const step = 7 * 24 * 60 * 60 * 1000;
    const dep =
      args.depositCents != null && Number.isFinite(Number(args.depositCents))
        ? Math.max(0, Math.floor(Number(args.depositCents)))
        : 0;
    const ns =
      args.noShowFeeCents != null && Number.isFinite(Number(args.noShowFeeCents))
        ? Math.max(0, Math.floor(Number(args.noShowFeeCents)))
        : 0;
    let staffIdResolved = args.clinicStaffUserId ?? null;
    let svcId = args.serviceId != null ? Number(args.serviceId) : null;
    let pkgId = args.packageId != null ? Number(args.packageId) : null;
    let durationMs = null;

    if (pkgId != null && svcId == null) {
      const pkg = await getBookablePackage(pkgId);
      if (!pkg?.items?.length) throw invalidServiceError();
      svcId = Number(pkg.items[0].service_id);
      durationMs = Number(pkg.duration_minutes || 60) * 60 * 1000;
    }
    const svcRow = svcId != null ? await getActiveServiceWithOrgOwner(svcId) : null;
    if (svcRow) {
      const orgOid = Number(svcRow.organization_id);
      const providerOwner = Number(svcRow.provider_user_id);
      const chosen = staffIdResolved != null ? Number(staffIdResolved) : providerOwner;
      if (!(await isUserBookableForOrg(chosen, orgOid, providerOwner))) {
        const err = new Error("STAFF_SERVICE_MISMATCH");
        err.code = "STAFF_SERVICE_MISMATCH";
        throw err;
      }
      staffIdResolved = chosen;
    }
    if (durationMs == null) {
      durationMs = Math.max(endMs - startMs, 15 * 60 * 1000);
    }

    for (let i = 0; i < n; i++) {
      const sIso = new Date(startMs).toISOString();
      const eIso = new Date(startMs + durationMs).toISOString();
      const blocked = await isBlockedByHoliday({
        clinicStaffUserId: staffIdResolved,
        startsAtIso: sIso,
        displayTimezone: args.displayTimezone || "UTC",
      });
      if (blocked) throw holidayError();
      if (
        staffIdResolved != null &&
        (await hasStaffOverlap({
          staffUserId: staffIdResolved,
          startsAt: sIso,
          endsAt: eIso,
        }))
      ) {
        await client.query("ROLLBACK");
        throw slotUnavailableError();
      }

      const row = await insertAppointmentRow(client, [
        staffIdResolved,
        args.petId ?? null,
        args.ownerUserId,
        sIso,
        eIso,
        args.displayTimezone || "UTC",
        args.notes?.trim() || null,
        args.reminderChannel || "auto",
        svcId,
        dep,
        ns,
        group,
        pkgId || null,
      ]);
      rows.push(row);
      startMs += step;
    }
    await client.query("COMMIT");
    return { recurring: true, recurrence_group: group, appointments: rows };
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* */
    }
    throw e;
  } finally {
    client.release();
  }
}

export async function enqueueWaitlistEntry({
  organizationId,
  ownerUserId,
  petId,
  serviceId,
  startsAt,
  endsAt,
  displayTimezone,
}) {
  const oid = Number(organizationId);
  if (!Number.isFinite(oid)) return null;
  const { rows } = await pool.query(
    `INSERT INTO appointment_waitlist (
       organization_id, owner_user_id, pet_id, service_id, starts_at, ends_at, display_timezone
     ) VALUES ($1,$2,$3,$4,$5::timestamptz,$6::timestamptz,$7)
     ON CONFLICT (organization_id, owner_user_id, service_id, starts_at) DO NOTHING
     RETURNING *`,
    [oid, ownerUserId, petId ?? null, serviceId ?? null, startsAt, endsAt, displayTimezone || "UTC"]
  );
  return rows[0] ?? null;
}

export async function listWaitlistForOrg(organizationId) {
  const { rows } = await pool.query(
    `SELECT * FROM appointment_waitlist WHERE organization_id = $1 AND status = 'waiting' ORDER BY created_at ASC`,
    [organizationId]
  );
  return rows;
}

export async function markWaitlistStatus(waitlistId, organizationId, status) {
  const { rows } = await pool.query(
    `UPDATE appointment_waitlist SET status = $3 WHERE id = $1 AND organization_id = $2 RETURNING *`,
    [waitlistId, organizationId, String(status)]
  );
  return rows[0] || null;
}

export async function markAppointmentNoShow(appointmentId) {
  const { rows } = await pool.query(
    `UPDATE appointments
     SET no_show_marked_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'scheduled'
     RETURNING *`,
    [appointmentId]
  );
  return rows[0] || null;
}

export async function listOrganizationAppointmentsDetailed({ fromIso, toIso, organizationId, clinicStaffUserId }) {
  const orgId = Number(organizationId);
  if (!Number.isFinite(orgId)) return [];
  const staffNum = clinicStaffUserId != null ? Number(clinicStaffUserId) : null;
  let q = `
    SELECT a.*,
           p.name AS pet_name,
           p.species AS pet_species,
           p.owner_phone AS pet_owner_phone,
           p.reminder_preference AS pet_reminder_preference,
           s.title AS service_title,
           o.display_name AS provider_org_name,
           o.org_type AS provider_org_type,
           s.organization_id AS service_organization_id,
           booked_staff.full_name AS staff_display_name,
           booked_staff.email AS staff_display_email,
           owner_u.full_name AS owner_display_name,
           owner_u.email AS owner_display_email,
           booked_staff_org_role.role_in_org AS staff_org_role
    FROM appointments a
    LEFT JOIN pets p ON p.id = a.pet_id
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN organizations o ON o.id = s.organization_id
    LEFT JOIN users booked_staff ON booked_staff.id = a.clinic_staff_user_id
    LEFT JOIN users owner_u ON owner_u.id = a.owner_user_id
    LEFT JOIN organization_members booked_staff_org_role
      ON booked_staff_org_role.organization_id = s.organization_id
     AND booked_staff_org_role.user_id = a.clinic_staff_user_id
    WHERE s.organization_id = $3
      AND a.starts_at < $2::timestamptz
      AND a.ends_at > $1::timestamptz
      AND a.status <> 'cancelled'
  `;
  const params = [fromIso, toIso, orgId];
  if (staffNum != null && Number.isFinite(staffNum)) {
    q += ` AND a.clinic_staff_user_id = $4`;
    params.push(staffNum);
  }
  q += ` ORDER BY a.starts_at`;
  const { rows } = await pool.query(q, params);
  return rows;
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
      const orgOid = Number(svc.organization_id);
      const owner = Number(svc.provider_user_id);
      const picked = nextStaff != null ? Number(nextStaff) : owner;
      if (!(await isUserBookableForOrg(picked, orgOid, owner))) {
        const err = new Error("STAFF_SERVICE_MISMATCH");
        err.code = "STAFF_SERVICE_MISMATCH";
        throw err;
      }
      nextStaff = picked;
      nextServiceId = n;
    }
  } else if (nextServiceId != null && patch.clinicStaffUserId !== undefined) {
    const svc = await getActiveServiceWithOrgOwner(nextServiceId);
    if (!svc) throw invalidServiceError();
    const orgOid = Number(svc.organization_id);
    const owner = Number(svc.provider_user_id);
    const picked = nextStaff != null ? Number(nextStaff) : owner;
    if (!(await isUserBookableForOrg(picked, orgOid, owner))) {
      const err = new Error("STAFF_SERVICE_MISMATCH");
      err.code = "STAFF_SERVICE_MISMATCH";
      throw err;
    }
    nextStaff = picked;
  }

  const nextPet = patch.petId !== undefined ? patch.petId : existing.pet_id;
  const nextOwner = existing.owner_user_id;

  if (new Date(nextEnd) <= new Date(nextStart)) throw badRangeError();
  await assertPetOwnedBy(nextPet, nextOwner);

  const startIso = typeof nextStart === "string" ? nextStart : nextStart.toISOString();
  const endIso = typeof nextEnd === "string" ? nextEnd : nextEnd.toISOString();

  if (
    patch.startsAt != null ||
    patch.displayTimezone != null ||
    patch.clinicStaffUserId !== undefined ||
    patch.serviceId !== undefined ||
    patch.service_id !== undefined
  ) {
    const blocked = await isBlockedByHoliday({
      clinicStaffUserId: nextStaff,
      startsAtIso: startIso,
      displayTimezone: nextTz,
    });
    if (blocked) throw holidayError();
    if (
      nextStaff != null &&
      (await hasStaffOverlap({
        staffUserId: nextStaff,
        startsAt: startIso,
        endsAt: endIso,
        excludeAppointmentId: id,
      }))
    ) {
      throw slotUnavailableError();
    }
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

export async function getAppointmentServiceOrganizationId(appointmentRow) {
  if (!appointmentRow?.service_id) return null;
  const svc = await getActiveServiceWithOrgOwner(appointmentRow.service_id);
  return svc ? Number(svc.organization_id) : null;
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
       INNER JOIN users u ON u.id = a.owner_user_id
       WHERE a.status = 'scheduled'
         AND COALESCE(u.notify_booking_reminder, true) IS TRUE
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
       INNER JOIN users u ON u.id = a.owner_user_id
       WHERE a.status = 'scheduled'
         AND COALESCE(u.notify_booking_reminder, true) IS TRUE
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
