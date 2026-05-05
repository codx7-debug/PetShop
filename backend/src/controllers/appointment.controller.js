import * as appointmentService from "../services/appointment.service.js";
import * as petService from "../services/pet.service.js";
import * as holidayService from "../services/holiday.service.js";
import { getActiveServiceWithOrgOwner } from "../services/serviceCatalog.service.js";

function normalizeAppointmentBody(b) {
  if (!b || typeof b !== "object") return b;
  return {
    ...b,
    ownerUserId: b.ownerUserId ?? b.owner_user_id,
    petId: b.petId ?? b.pet_id,
    startsAt: b.startsAt ?? b.starts_at,
    endsAt: b.endsAt ?? b.ends_at,
    displayTimezone: b.displayTimezone ?? b.display_timezone,
    reminderChannel: b.reminderChannel ?? b.reminder_channel,
    clinicStaffUserId: b.clinicStaffUserId ?? b.clinic_staff_user_id,
    serviceId: b.serviceId ?? b.service_id,
    packageId: b.packageId ?? b.package_id,
    depositCents: b.depositCents ?? b.deposit_cents,
    noShowFeeCents: b.noShowFeeCents ?? b.no_show_fee_cents,
    recurrence: b.recurrence ?? b.recurrence_rule,
    organizationId: b.organizationId ?? b.organization_id,
  };
}

function normalizePetBody(b) {
  if (!b || typeof b !== "object") return b;
  return {
    ...b,
    ownerUserId: b.ownerUserId ?? b.owner_user_id,
    name: b.name,
    species: b.species,
    breed: b.breed,
    notes: b.notes,
    ownerPhone: b.ownerPhone ?? b.owner_phone,
    whatsappOptIn: b.whatsappOptIn ?? b.whatsapp_opt_in,
    reminderPreference: b.reminderPreference ?? b.reminder_preference,
  };
}

function mapError(err, res) {
  if (err.code === "HOLIDAY_BLOCKED") return res.status(409).json({ error: "That time falls on a clinic holiday." });
  if (err.code === "INVALID_TIME_RANGE") return res.status(400).json({ error: "endsAt must be after startsAt." });
  if (err.code === "PET_OWNER_MISMATCH") return res.status(400).json({ error: "Pet does not belong to this owner." });
  if (err.code === "INVALID_SERVICE") return res.status(400).json({ error: "Unknown or inactive service." });
  if (err.code === "STAFF_SERVICE_MISMATCH") {
    return res.status(400).json({ error: "Staff user must match the organization that owns this service." });
  }
  if (err.code === "SLOT_UNAVAILABLE") {
    return res
      .status(409)
      .json({ error: "That staff member is already booked for this time.", code: "SLOT_UNAVAILABLE" });
  }
  return null;
}

export async function listAppointments(req, res) {
  const { from, to, clinicStaffUserId } = req.query;
  if (!from || !to) return res.status(400).json({ error: "Query params `from` and `to` (ISO datetimes) are required." });
  const staff =
    clinicStaffUserId === undefined || clinicStaffUserId === ""
      ? null
      : Number.parseInt(String(clinicStaffUserId), 10);
  const rows = await appointmentService.listAppointmentsInRange({
    fromIso: from,
    toIso: to,
    clinicStaffUserId: Number.isFinite(staff) ? staff : null,
  });
  res.json(rows);
}

export async function createAppointment(req, res) {
  try {
    const row = await appointmentService.createAppointment(normalizeAppointmentBody(req.body));
    if (row?.recurring === true) return res.status(201).json(row);
    res.status(201).json(row);
  } catch (err) {
    const done = mapError(err, res);
    if (done) return;
    console.error(err);
    res.status(500).json({ error: "Could not create appointment." });
  }
}

export async function patchAppointment(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
    const row = await appointmentService.updateAppointment(id, normalizeAppointmentBody(req.body));
    if (!row) return res.status(404).json({ error: "Appointment not found or not scheduled." });
    res.json(row);
  } catch (err) {
    const done = mapError(err, res);
    if (done) return;
    console.error(err);
    res.status(500).json({ error: "Could not update appointment." });
  }
}

export async function cancelAppointment(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  const row = await appointmentService.cancelAppointment(id);
  if (!row) return res.status(404).json({ error: "Appointment not found or already cancelled." });
  res.json(row);
}

export async function createPet(req, res) {
  try {
    const row = await petService.createPet(normalizePetBody(req.body));
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create pet." });
  }
}

export async function listPetsByOwner(req, res) {
  const ownerUserId = Number.parseInt(req.params.ownerUserId, 10);
  if (!Number.isFinite(ownerUserId)) return res.status(400).json({ error: "Invalid owner id." });
  const rows = await petService.listPetsByOwner(ownerUserId);
  res.json(rows);
}

export async function getPet(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  const row = await petService.getPetById(id);
  if (!row) return res.status(404).json({ error: "Pet not found." });
  res.json(row);
}

export async function listHolidays(req, res) {
  const { from, to, clinicStaffUserId } = req.query;
  if (!from || !to) return res.status(400).json({ error: "Query params `from` and `to` (YYYY-MM-DD) are required." });
  const staff =
    clinicStaffUserId === undefined || clinicStaffUserId === ""
      ? null
      : Number.parseInt(String(clinicStaffUserId), 10);
  const rows = await holidayService.listHolidays({
    fromDate: from,
    toDate: to,
    clinicStaffUserId: Number.isFinite(staff) ? staff : null,
  });
  res.json(rows);
}

export async function enqueueWaitlist(req, res) {
  try {
    const b = normalizeAppointmentBody(req.body) || {};
    const orgIdRaw = b.organizationId ?? b.organization_id;
    let organizationId = Number(orgIdRaw);
    const sid = b.serviceId ?? b.service_id;
    if ((!Number.isFinite(organizationId) || organizationId <= 0) && sid != null) {
      const svc = await getActiveServiceWithOrgOwner(Number(sid));
      if (svc?.organization_id != null) organizationId = Number(svc.organization_id);
    }
    if (!Number.isFinite(organizationId)) {
      return res.status(400).json({ error: "organizationId or valid serviceId required." });
    }
    const row = await appointmentService.enqueueWaitlistEntry({
      organizationId,
      ownerUserId: b.ownerUserId,
      petId: b.petId,
      serviceId: sid != null ? Number(sid) : null,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      displayTimezone: b.displayTimezone,
    });
    if (!row) {
      return res.status(409).json({ error: "Already on waitlist for this slot, or could not add." });
    }
    res.status(201).json({ waitlist: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add to waitlist." });
  }
}

export async function createHoliday(req, res) {
  try {
    const row = await holidayService.addHoliday(req.body);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add holiday." });
  }
}
