import bcrypt from "bcryptjs";
import * as userDb from "../services/userDb.service.js";
import * as orgService from "../services/organization.service.js";
import * as catalogService from "../services/serviceCatalog.service.js";
import * as appointmentService from "../services/appointment.service.js";
import * as packageService from "../services/servicePackage.service.js";
import * as memberService from "../services/organizationMember.service.js";
import * as inventoryService from "../services/orgInventory.service.js";
import * as notifyHub from "../services/notificationHub.service.js";

function ctxOrg(req) {
  return Number(req.organizationContext?.organizationId);
}

function portalRole(req) {
  return String(req.organizationContext?.portalRole || "").toLowerCase();
}

function ownerOnly(req, res) {
  if (portalRole(req) !== "org") {
    res.status(403).json({ error: "Only the organization owner can perform this action." });
    return false;
  }
  return true;
}

export async function getMyOrganization(req, res) {
  const oid = ctxOrg(req);
  if (!Number.isFinite(oid)) return res.status(400).json({ error: "Missing organization." });
  try {
    const row = await orgService.getOrganizationById(oid);
    if (!row) return res.status(404).json({ error: "No organization profile yet." });
    res.json({ organization: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load organization." });
  }
}

export async function putMyOrganization(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  try {
    const ownerId = await orgService.getOrganizationOwnerUserId(oid);
    const row = await orgService.updateOrganizationByOwner(Number(ownerId), req.body || {});
    if (!row) return res.status(404).json({ error: "No organization profile found." });
    res.json({ organization: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update organization." });
  }
}

export async function listMyServices(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await catalogService.listServicesByOrganizationId(oid, { activeOnly: false });
    res.json({ services: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load services." });
  }
}

export async function postMyService(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  try {
    const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
    const row = await catalogService.createService(ownerUid, req.body || {});
    if (!row) return res.status(404).json({ error: "No organization profile for this account." });
    res.status(201).json({ service: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create service." });
  }
}

export async function patchMyService(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
  const serviceId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(serviceId)) return res.status(400).json({ error: "Invalid service id." });
  try {
    const row = await catalogService.updateService(ownerUid, serviceId, req.body || {});
    if (!row) return res.status(404).json({ error: "Service not found." });
    res.json({ service: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update service." });
  }
}

/** Multi-staff calendar: all bookings for services under this organization. Optional `clinicStaffUserId` filters one staff column. */
export async function listMyAppointments(req, res) {
  const oid = ctxOrg(req);
  const { from, to } = req.query;
  const staffRaw = req.query.clinicStaffUserId;
  if (!from || !to) {
    return res.status(400).json({ error: "Query params `from` and `to` (ISO datetimes) are required." });
  }
  const staff =
    staffRaw === undefined || staffRaw === "" ? null : Number.parseInt(String(staffRaw), 10);
  try {
    const rows = await appointmentService.listOrganizationAppointmentsDetailed({
      fromIso: from,
      toIso: to,
      organizationId: oid,
      clinicStaffUserId: Number.isFinite(staff) ? staff : null,
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load appointments." });
  }
}

export async function postBroadcast(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  try {
    const out = await notifyHub.insertBroadcastForOrg(oid, req.body || {});
    if (!out) return res.status(400).json({ error: "Title and body required." });
    res.status(201).json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not send broadcast." });
  }
}

export async function listMyMembers(req, res) {
  const oid = ctxOrg(req);
  if (!ownerOnly(req, res)) return;
  try {
    const rows = await memberService.listMembersWithUsers(oid);
    res.json({ members: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load staff." });
  }
}

export async function postMyMember(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const body = req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const full_name = String(body.full_name || "").trim();
  const role_in_org = String(body.role_in_org || body.role || "reception").trim().slice(0, 32) || "reception";

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: "Email and password (≥6 chars) required." });
  }
  if (!full_name) return res.status(400).json({ error: "Full name required." });

  try {
    const existing = await userDb.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "This email already has an account." });
    const hash = await bcrypt.hash(password, 10);
    const user = await userDb.createUser({
      full_name,
      email,
      password: hash,
      role: "org_staff",
      status: "active",
      org_name: null,
      org_contact: null,
    });
    await memberService.addMember(oid, { userId: user.id, role_in_org });
    res.status(201).json({
      member: {
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        role_in_org,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not invite staff member." });
  }
}

export async function deleteMyMember(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const uid = Number.parseInt(req.params.userId, 10);
  if (!Number.isFinite(uid)) return res.status(400).json({ error: "Invalid user id." });
  try {
    const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
    if (uid === ownerUid) return res.status(400).json({ error: "Cannot remove the owner from the roster." });
    await memberService.removeMember(oid, uid);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove staff." });
  }
}

export async function listMyPackages(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await packageService.listPackagesByOrganizationId(oid, { activeOnly: false });
    res.json({ packages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load bundles." });
  }
}

export async function postMyPackage(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
  try {
    const row = await packageService.createPackage(ownerUid, req.body || {});
    if (!row) return res.status(404).json({ error: "Could not create package." });
    res.status(201).json({ package: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create package." });
  }
}

export async function patchMyPackage(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
  const packageId = Number.parseInt(req.params.id, 10);
  try {
    const row = await packageService.updatePackage(ownerUid, packageId, req.body || {});
    if (!row) return res.status(404).json({ error: "Package not found." });
    res.json({ package: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update package." });
  }
}

export async function putMyPackageItems(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
  const packageId = Number.parseInt(req.params.id, 10);
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  try {
    const pkg = await packageService.setPackageItems(ownerUid, packageId, items);
    if (!pkg) return res.status(404).json({ error: "Package not found." });
    res.json({ package: pkg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update package services." });
  }
}

export async function listMyInventory(req, res) {
  const oid = ctxOrg(req);
  try {
    const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
    const rows = await inventoryService.listInventory(ownerUid);
    res.json({ items: rows || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load inventory." });
  }
}

export async function upsertInventory(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
  try {
    const row = await inventoryService.upsertInventoryItem(ownerUid, req.body || {});
    if (!row) return res.status(400).json({ error: "Could not save item." });
    res.status(req.body?.id ? 200 : 201).json({ item: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save inventory item." });
  }
}

export async function deleteInventory(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const ownerUid = Number(await orgService.getOrganizationOwnerUserId(oid));
  const itemId = Number.parseInt(req.params.id, 10);
  try {
    const ok = await inventoryService.deleteInventoryItem(ownerUid, itemId);
    if (!ok) return res.status(404).json({ error: "Not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete item." });
  }
}

export async function listMyWaitlist(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await appointmentService.listWaitlistForOrg(oid);
    res.json({ waitlist: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load waitlist." });
  }
}

export async function patchAppointmentNoShow(req, res) {
  const oid = ctxOrg(req);
  const appointmentId = Number.parseInt(req.params.id, 10);
  try {
    const row = await appointmentService.getAppointmentById(appointmentId);
    if (!row) return res.status(404).json({ error: "Appointment not found." });
    const apptOrgId = await appointmentService.getAppointmentServiceOrganizationId(row);
    if (apptOrgId == null || Number(apptOrgId) !== oid) return res.status(403).json({ error: "Not this org." });
    const updated = await appointmentService.markAppointmentNoShow(appointmentId);
    if (!updated) return res.status(400).json({ error: "Could not mark no-show." });
    res.json({ appointment: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update appointment." });
  }
}
