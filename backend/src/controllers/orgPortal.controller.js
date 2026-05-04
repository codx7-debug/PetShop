import * as orgService from "../services/organization.service.js";
import * as catalogService from "../services/serviceCatalog.service.js";
import * as appointmentService from "../services/appointment.service.js";

export async function getMyOrganization(req, res) {
  const ownerId = req.auth.id;
  try {
    const row = await orgService.getOrganizationByOwnerUserId(ownerId);
    if (!row) return res.status(404).json({ error: "No organization profile yet. Complete registration or contact support." });
    res.json({ organization: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load organization." });
  }
}

export async function putMyOrganization(req, res) {
  const ownerId = req.auth.id;
  try {
    const row = await orgService.updateOrganizationByOwner(ownerId, req.body || {});
    if (!row) return res.status(404).json({ error: "No organization profile found." });
    res.json({ organization: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update organization." });
  }
}

export async function listMyServices(req, res) {
  const ownerId = req.auth.id;
  try {
    const org = await orgService.getOrganizationByOwnerUserId(ownerId);
    if (!org) return res.status(404).json({ error: "No organization profile." });
    const rows = await catalogService.listServicesByOrganizationId(org.id, { activeOnly: false });
    res.json({ services: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load services." });
  }
}

export async function postMyService(req, res) {
  const ownerId = req.auth.id;
  try {
    const row = await catalogService.createService(ownerId, req.body || {});
    if (!row) return res.status(404).json({ error: "No organization profile for this account." });
    res.status(201).json({ service: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create service." });
  }
}

export async function patchMyService(req, res) {
  const ownerId = req.auth.id;
  const serviceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(serviceId)) return res.status(400).json({ error: "Invalid service id." });
  try {
    const row = await catalogService.updateService(ownerId, serviceId, req.body || {});
    if (!row) return res.status(404).json({ error: "Service not found." });
    res.json({ service: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update service." });
  }
}

/** Calendar for this provider only — bookings where the service belongs to this org owner. */
export async function listMyAppointments(req, res) {
  const ownerId = req.auth.id;
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "Query params `from` and `to` (ISO datetimes) are required." });
  }
  try {
    const rows = await appointmentService.listProviderAppointmentsDetailed({
      fromIso: from,
      toIso: to,
      clinicStaffUserId: ownerId,
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load appointments." });
  }
}
