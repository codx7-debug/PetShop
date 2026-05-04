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
