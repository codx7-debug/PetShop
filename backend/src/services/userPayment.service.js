import pool from "../config/db.js";

export async function listCardsByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT id, label, brand, last_four, holder_name, is_default, created_at
     FROM user_payment_cards WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return rows;
}

export async function listTransactionsByUserId(userId, { limit = 100 } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 100, 1), 300);
  const { rows } = await pool.query(
    `SELECT id, amount_cents, currency, title, status, address_text, created_at
     FROM user_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, lim]
  );
  return rows;
}

export async function createCardForUser(userId, { label, brand, last_four, holder_name, is_default }) {
  const four = String(last_four || "")
    .replace(/\D/g, "")
    .slice(-4);
  if (four.length !== 4) {
    const err = new Error("LAST_FOUR_INVALID");
    err.code = "LAST_FOUR_INVALID";
    throw err;
  }
  if (is_default) {
    await pool.query(`UPDATE user_payment_cards SET is_default = false WHERE user_id = $1`, [userId]);
  }
  const { rows } = await pool.query(
    `INSERT INTO user_payment_cards (user_id, label, brand, last_four, holder_name, is_default)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, label, brand, last_four, holder_name, is_default, created_at`,
    [
      userId,
      label?.trim() || null,
      String(brand || "card").trim().slice(0, 40),
      four,
      holder_name?.trim() || null,
      Boolean(is_default),
    ]
  );
  return rows[0];
}
