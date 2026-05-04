import * as userDb from "../services/userDb.service.js";
import * as petService from "../services/pet.service.js";
import * as paymentService from "../services/userPayment.service.js";
import { shapePublicUser } from "./authApi.controller.js";
import { getOrganizationByOwnerUserId } from "../services/organization.service.js";

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
    let orgRow = null;
    if (String(row.role || "").toLowerCase() === "org") {
      orgRow = await getOrganizationByOwnerUserId(uid);
    }
    res.json({ user: shapePublicUser(row, orgRow) });
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
    };
    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    );
    if (cleaned.full_name !== undefined && !String(cleaned.full_name || "").trim()) {
      return res.status(400).json({ error: "Full name cannot be empty." });
    }
    const row = await userDb.updateUserProfile(uid, cleaned);
    if (!row) return res.status(404).json({ error: "User not found." });
    let orgRow = null;
    if (String(row.role || "").toLowerCase() === "org") {
      orgRow = await getOrganizationByOwnerUserId(uid);
    }
    res.json({ user: shapePublicUser(row, orgRow) });
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
