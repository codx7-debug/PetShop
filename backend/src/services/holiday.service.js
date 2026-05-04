import pool from "../config/db.js";
import { localDateString } from "../utils/timezone.js";

export async function listHolidays({ clinicStaffUserId, fromDate, toDate }) {
  let q = `SELECT id, clinic_staff_user_id, holiday_date, title FROM clinic_holidays WHERE holiday_date >= $1 AND holiday_date <= $2`;
  const params = [fromDate, toDate];
  if (clinicStaffUserId != null) {
    q += ` AND (clinic_staff_user_id IS NULL OR clinic_staff_user_id = $3)`;
    params.push(clinicStaffUserId);
  }
  q += ` ORDER BY holiday_date`;
  const { rows } = await pool.query(q, params);
  return rows;
}

export async function addHoliday({ clinicStaffUserId, holidayDate, title }) {
  const { rows } = await pool.query(
    `INSERT INTO clinic_holidays (clinic_staff_user_id, holiday_date, title)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [clinicStaffUserId ?? null, holidayDate, title]
  );
  return rows[0];
}

/** True if date (YYYY-MM-DD in displayTimezone) is blocked by a holiday for this clinic. */
export async function isBlockedByHoliday({ clinicStaffUserId, startsAtIso, displayTimezone }) {
  const d = localDateString(startsAtIso, displayTimezone);
  const { rows } = await pool.query(
    `SELECT id FROM clinic_holidays
     WHERE holiday_date = $1::date
       AND (clinic_staff_user_id IS NULL OR clinic_staff_user_id = $2)`,
    [d, clinicStaffUserId ?? null]
  );
  return rows.length > 0;
}
