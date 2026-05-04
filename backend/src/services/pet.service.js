import pool from "../config/db.js";

export async function createPet({ ownerUserId, name, species, breed, notes, ownerPhone, whatsappOptIn, reminderPreference }) {
  const { rows } = await pool.query(
    `INSERT INTO pets (owner_user_id, name, species, breed, notes, owner_phone, whatsapp_opt_in, reminder_preference)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      ownerUserId,
      name.trim(),
      species?.trim() || null,
      breed?.trim() || null,
      notes?.trim() || null,
      ownerPhone?.trim() || null,
      Boolean(whatsappOptIn),
      reminderPreference || "auto",
    ]
  );
  return rows[0];
}

export async function listPetsByOwner(ownerUserId) {
  const { rows } = await pool.query(
    `SELECT * FROM pets WHERE owner_user_id = $1 ORDER BY created_at DESC`,
    [ownerUserId]
  );
  return rows;
}

export async function getPetById(id) {
  const { rows } = await pool.query(`SELECT * FROM pets WHERE id = $1`, [id]);
  return rows[0] || null;
}

const PET_PATCHABLE = ["name", "species", "breed", "notes", "owner_phone", "whatsapp_opt_in", "reminder_preference"];

export async function updatePetForOwner(petId, ownerUserId, patch) {
  const pet = await getPetById(petId);
  if (!pet || Number(pet.owner_user_id) !== Number(ownerUserId)) return null;
  const fields = [];
  const vals = [];
  let i = 1;
  for (const col of PET_PATCHABLE) {
    if (!Object.prototype.hasOwnProperty.call(patch, col)) continue;
    let v = patch[col];
    if (col === "name") {
      v = String(v || "").trim();
      if (!v) {
        const err = new Error("PET_NAME_REQUIRED");
        err.code = "PET_NAME_REQUIRED";
        throw err;
      }
      fields.push(`${col} = $${i++}`);
      vals.push(v);
    } else if (col === "whatsapp_opt_in") {
      fields.push(`${col} = $${i++}`);
      vals.push(Boolean(v));
    } else if (col === "reminder_preference") {
      fields.push(`${col} = $${i++}`);
      vals.push(String(v || "auto").trim().slice(0, 16));
    } else {
      const s = v == null ? null : String(v).trim();
      fields.push(`${col} = $${i++}`);
      vals.push(s || null);
    }
  }
  if (!fields.length) return pet;
  fields.push(`updated_at = NOW()`);
  vals.push(petId);
  const { rows } = await pool.query(
    `UPDATE pets SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    vals
  );
  return rows[0] || null;
}
