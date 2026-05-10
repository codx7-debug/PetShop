import * as userDb from "../services/userDb.service.js";
import * as adoptionListing from "../services/adoptionListing.service.js";
import * as petService from "../services/pet.service.js";
import * as paymentService from "../services/userPayment.service.js";
import { shapePublicUser } from "./authApi.controller.js";
import { getOrganizationByOwnerUserId, getOrganizationById } from "../services/organization.service.js";
import { getMembershipByStaffUserId } from "../services/organizationMember.service.js";
import * as discoveryService from "../services/discovery.service.js";
import * as notificationHub from "../services/notificationHub.service.js";
import * as facilityService from "../services/facility.service.js";
import * as clinic from "../services/clinicRecords.service.js";
import { wizardSuggestions } from "../services/vaccineWizard.service.js";

function requireRealUser(req, res) {
  const id = req.auth?.id;
  if (id == null || id === 0) {
    res.status(403).json({ error: "Not available for this account type." });
    return null;
  }
  return Number(id);
}

export async function getMe(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const row = await userDb.getUserById(uid);
    if (!row) return res.status(404).json({ error: "User not found." });
    const r = String(row.role || "").toLowerCase();
    let orgRow = null;
    let orgMember = null;
    if (r === "org") {
      orgRow = await getOrganizationByOwnerUserId(uid);
    } else if (r === "org_staff") {
      orgMember = await getMembershipByStaffUserId(uid);
      orgRow = orgMember ? await getOrganizationById(orgMember.organization_id) : null;
    }
    res.json({ user: shapePublicUser(row, orgRow, orgMember) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load profile." });
  }
}

export async function putMe(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const body = req.body || {};
    const patch = {
      full_name: body.full_name,
      phone: body.phone,
      date_of_birth: body.date_of_birth,
      address_line: body.address_line,
      address_city: body.address_city,
      address_region: body.address_region,
      address_postal: body.address_postal,
      address_country: body.address_country,
      notify_email: body.notify_email,
      notify_push: body.notify_push,
      notify_marketing: body.notify_marketing,
      notify_booking_reminder: body.notify_booking_reminder,
      notify_org_broadcast: body.notify_org_broadcast,
    };
    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    );
    if (cleaned.full_name !== undefined && !String(cleaned.full_name || "").trim()) {
      return res.status(400).json({ error: "Full name cannot be empty." });
    }
    const row = await userDb.updateUserProfile(uid, cleaned);
    if (!row) return res.status(404).json({ error: "User not found." });
    const r2 = String(row.role || "").toLowerCase();
    let orgRow = null;
    let orgMember = null;
    if (r2 === "org") {
      orgRow = await getOrganizationByOwnerUserId(uid);
    } else if (r2 === "org_staff") {
      orgMember = await getMembershipByStaffUserId(uid);
      orgRow = orgMember ? await getOrganizationById(orgMember.organization_id) : null;
    }
    res.json({ user: shapePublicUser(row, orgRow, orgMember) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update profile." });
  }
}

export async function listMyPets(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const rows = await petService.listPetsByOwner(uid);
    res.json({ pets: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load pets." });
  }
}

export async function postMyPet(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  if (String(req.auth.role || "").toLowerCase() !== "user") {
    return res.status(403).json({ error: "Only pet owner accounts can add pets here." });
  }
  try {
    const body = req.body || {};
    const row = await petService.createPet({
      ownerUserId: uid,
      name: body.name,
      species: body.species,
      breed: body.breed,
      notes: body.notes,
      ownerPhone: body.owner_phone ?? body.ownerPhone,
      whatsappOptIn: body.whatsapp_opt_in ?? body.whatsappOptIn,
      reminderPreference: body.reminder_preference ?? body.reminderPreference,
    });
    res.status(201).json({ pet: row });
  } catch (err) {
    if (err.code === "23505") {
      /* unlikely */
    }
    console.error(err);
    res.status(500).json({ error: "Could not create pet." });
  }
}

export async function patchMyPet(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  const petId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet id." });
  if (String(req.auth.role || "").toLowerCase() !== "user") {
    return res.status(403).json({ error: "Only pet owner accounts can edit pets here." });
  }
  try {
    const body = req.body || {};
    const row = await petService.updatePetForOwner(petId, uid, {
      name: body.name,
      species: body.species,
      breed: body.breed,
      notes: body.notes,
      owner_phone: body.owner_phone ?? body.ownerPhone,
      whatsapp_opt_in: body.whatsapp_opt_in ?? body.whatsappOptIn,
      reminder_preference: body.reminder_preference ?? body.reminderPreference,
    });
    if (!row) return res.status(404).json({ error: "Pet not found." });
    res.json({ pet: row });
  } catch (err) {
    if (err.code === "PET_NAME_REQUIRED") {
      return res.status(400).json({ error: "Pet name is required." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not update pet." });
  }
}

export async function listMyCards(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const cards = await paymentService.listCardsByUserId(uid);
    res.json({ cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load cards." });
  }
}

export async function listMyTransactions(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 80;
    const transactions = await paymentService.listTransactionsByUserId(uid, { limit });
    res.json({ transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load transactions." });
  }
}

export async function postMyCard(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const body = req.body || {};
    const row = await paymentService.createCardForUser(uid, {
      label: body.label,
      brand: body.brand,
      last_four: body.last_four ?? body.lastFour,
      holder_name: body.holder_name ?? body.holderName,
      is_default: body.is_default ?? body.isDefault,
    });
    res.status(201).json({ card: row });
  } catch (err) {
    if (err.code === "LAST_FOUR_INVALID") {
      return res.status(400).json({ error: "Provide the last 4 digits of the card." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not save card." });
  }
}

export async function listMyCatalogFavorites(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const organizations = await discoveryService.listFavoriteOrganizations(uid);
    res.json({ organizations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load favorites." });
  }
}

export async function listMyCatalogRecent(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const organizations = await discoveryService.listRecentOrganizations(uid, { limit: 16 });
    res.json({ organizations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load recents." });
  }
}

export async function postMyCatalogFavorite(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  const oid = Number(req.body?.organization_id ?? req.body?.organizationId);
  if (!Number.isFinite(oid)) return res.status(400).json({ error: "organization_id required." });
  try {
    await discoveryService.setFavoriteOrganization(uid, oid, true);
    res.status(201).json({ ok: true, organization_id: oid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update favorite." });
  }
}

export async function deleteMyCatalogFavorite(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  const oid = Number.parseInt(req.params.organizationId, 10);
  if (!Number.isFinite(oid)) return res.status(400).json({ error: "Bad id." });
  try {
    await discoveryService.setFavoriteOrganization(uid, oid, false);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove favorite." });
  }
}

export async function listMyNotifications(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const rows = await notificationHub.listInboxForUser(uid, { limit: 80 });
    res.json({ notifications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load notifications." });
  }
}

export async function patchNotificationRead(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  const nid = Number.parseInt(req.params.id, 10);
  try {
    const row = await notificationHub.markNotificationRead(uid, nid);
    if (!row) return res.status(404).json({ error: "Not found." });
    res.json({ notification: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update notification." });
  }
}

export async function getVaccineWizardSuggestions(req, res) {
  const callerId = requireRealUser(req, res);
  if (callerId == null) return;
  void callerId;
  if (String(req.auth.role || "").trim().toLowerCase() !== "user") {
    return res.status(403).json({ error: "Pet parent accounts only." });
  }
  const species = req.query.species ?? req.query.s;
  const ageRaw = req.query.age_months ?? req.query.ageMonths ?? req.query.age;
  try {
    const suggestions = wizardSuggestions(species, ageRaw);
    res.json({ disclaimer: "Educational only — follow your clinician.", suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load suggestions." });
  }
}

export async function listPetVaccinations(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  if (String(req.auth.role || "").trim().toLowerCase() !== "user") {
    return res.status(403).json({ error: "Pet parent accounts only." });
  }
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet id." });
  try {
    const rows = await facilityService.listVaccinationsForPet(petId, uid);
    if (rows === null) return res.status(404).json({ error: "Pet not found." });
    res.json({ vaccinations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load vaccinations." });
  }
}

export async function postPetVaccination(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  if (String(req.auth.role || "").trim().toLowerCase() !== "user") {
    return res.status(403).json({ error: "Pet parent accounts only." });
  }
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet id." });
  try {
    const row = await facilityService.addVaccinationForPet({
      petId,
      ownerUserId: uid,
      orgId: null,
      body: req.body || {},
    });
    res.status(201).json({ vaccination: row });
  } catch (err) {
    if (err.code === "PET_NOT_FOUND") return res.status(404).json({ error: "Pet not found." });
    if (err.code === "PET_FORBIDDEN") return res.status(403).json({ error: "Not your pet." });
    if (err.code === "VACC_FIELDS") {
      return res.status(400).json({ error: "vaccine_name and administered_on required." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not save vaccination." });
  }
}

export async function deletePetVaccination(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  if (String(req.auth.role || "").trim().toLowerCase() !== "user") {
    return res.status(403).json({ error: "Pet parent accounts only." });
  }
  const vid = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(vid)) return res.status(400).json({ error: "Invalid id." });
  try {
    const deleted = await facilityService.deleteVaccinationForPetOwner(vid, uid);
    if (!deleted) return res.status(404).json({ error: "Not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete." });
  }
}

/** Local ledger only — not synced to national IYS. Pet parents can stamp their own preference. */
export async function postMyCommercialConsent(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  try {
    const row = await clinic.recordConsent({
      userId: uid,
      organizationId: null,
      optedIn: Boolean(req.body?.opted_in ?? req.body?.optedIn),
      channel: String(req.body?.channel || "commercial").slice(0, 40),
      source: String(req.body?.source || "pet_parent_profile").slice(0, 80),
      notes: req.body?.notes,
      recordedByUserId: uid,
    });
    res.status(201).json({ consent: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not record preference." });
  }
}

export async function listAdoptionListingsPublic(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 60;
    const listings = await adoptionListing.listAvailablePublic({ limit });
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load adoption listings." });
  }
}

export async function getAdoptionListingPublic(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const row = await adoptionListing.getPublicById(id);
    if (!row) return res.status(404).json({ error: "Not found." });
    res.json({ listing: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load listing." });
  }
}

export async function postMyAdoptionListing(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  if (String(req.auth.role || "").toLowerCase() !== "user") {
    return res.status(403).json({ error: "Only pet parent accounts can list pets for adoption." });
  }
  const cleaned = adoptionListing.sanitizeListingPayload(req.body || {});
  if (!cleaned.pet_name || !cleaned.species || !cleaned.age_label) {
    return res.status(400).json({ error: "pet_name, species, and age_label are required." });
  }
  try {
    const row = await adoptionListing.createListing(uid, cleaned);
    if (!row) return res.status(500).json({ error: "Could not create listing." });
    res.status(201).json({ listing: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create listing." });
  }
}

export async function listMyAdoptionListings(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  if (String(req.auth.role || "").toLowerCase() !== "user") {
    return res.status(403).json({ error: "Only pet parent accounts can view their listings." });
  }
  try {
    const listings = await adoptionListing.listByOwner(uid);
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load your listings." });
  }
}

export async function deleteMyAdoptionListing(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  if (String(req.auth.role || "").toLowerCase() !== "user") {
    return res.status(403).json({ error: "Forbidden." });
  }
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const del = await adoptionListing.deleteListingForOwner(id, uid);
    if (!del) return res.status(404).json({ error: "Listing not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove listing." });
  }
}

/** Pet parent only — removes the signed-in user and related data (CASCADE). */
export async function deleteMyAccount(req, res) {
  const uid = requireRealUser(req, res);
  if (uid == null) return;
  if (String(req.auth.role || "").toLowerCase() !== "user") {
    return res
      .status(403)
      .json({ error: "Only pet parent accounts can delete their profile this way. Contact support for org accounts." });
  }
  try {
    const row = await userDb.deleteUserById(uid);
    if (!row) return res.status(404).json({ error: "User not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete account." });
  }
}
