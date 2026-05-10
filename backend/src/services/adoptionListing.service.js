import pool from "../config/db.js";

const MAX_PHOTO_CHARS = 120_000;
const MAX_DESC_CHARS = 4000;

export function sanitizeListingPayload(body) {
  const pet_name = String(body?.pet_name ?? body?.petName ?? "").trim().slice(0, 120);
  const species = String(body?.species ?? "").trim().slice(0, 80);
  const breedRaw = body?.breed;
  const breed = breedRaw == null || String(breedRaw).trim() === "" ? null : String(breedRaw).trim().slice(0, 120);
  const age_label = String(body?.age_label ?? body?.ageLabel ?? "").trim().slice(0, 80);
  let description = body?.description;
  description =
    description == null || String(description).trim() === ""
      ? null
      : String(description).trim().slice(0, MAX_DESC_CHARS);
  let photo_url = body?.photo_url ?? body?.photoUrl ?? null;
  if (photo_url != null && String(photo_url).trim() !== "") {
    photo_url = String(photo_url).trim();
    if (photo_url.length > MAX_PHOTO_CHARS) photo_url = null;
  } else photo_url = null;

  return { pet_name, species, breed, age_label, description, photo_url };
}

export async function createListing(ownerUserId, payload) {
  const { pet_name, species, breed, age_label, description, photo_url } = payload;
  const { rows } = await pool.query(
    `INSERT INTO adoption_listings
      (owner_user_id, pet_name, species, breed, age_label, description, photo_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'available')
     RETURNING id, pet_name, species, breed, age_label, description, photo_url, status, created_at`,
    [ownerUserId, pet_name, species, breed, age_label, description, photo_url]
  );
  return rows[0] || null;
}

export async function listAvailablePublic({ limit = 60 } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 60, 1), 120);
  const { rows } = await pool.query(
    `SELECT id, pet_name, species, breed, age_label, description, photo_url, created_at
     FROM adoption_listings
     WHERE status = 'available'
     ORDER BY created_at DESC
     LIMIT $1`,
    [lim]
  );
  return rows;
}

export async function listByOwner(ownerUserId) {
  const uid = Number(ownerUserId);
  if (!Number.isFinite(uid) || uid <= 0) return [];
  const { rows } = await pool.query(
    `SELECT id, pet_name, species, breed, age_label, description, photo_url, status, created_at
     FROM adoption_listings
     WHERE owner_user_id = $1
     ORDER BY created_at DESC`,
    [uid]
  );
  return rows;
}

export async function getPublicById(id) {
  const lid = Number(id);
  if (!Number.isFinite(lid) || lid <= 0) return null;
  const { rows } = await pool.query(
    `SELECT id, pet_name, species, breed, age_label, description, photo_url, created_at
     FROM adoption_listings
     WHERE id = $1 AND status = 'available'
     LIMIT 1`,
    [lid]
  );
  return rows[0] || null;
}

export async function deleteListingForOwner(listingId, ownerUserId) {
  const lid = Number(listingId);
  const uid = Number(ownerUserId);
  if (!Number.isFinite(lid) || !Number.isFinite(uid)) return null;
  const { rows } = await pool.query(
    `DELETE FROM adoption_listings
     WHERE id = $1 AND owner_user_id = $2
     RETURNING id`,
    [lid, uid]
  );
  return rows[0] || null;
}
