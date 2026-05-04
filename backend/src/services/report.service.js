import pool from "../config/db.js";
import { getOrganizationByOwnerUserId } from "./organization.service.js";

const ALLOWED_STATUS = ["open", "in_progress", "resolved"];

/** Injury / emergency reports are routed to veterinary (clinic) organizations only. */
export function organizationCanHandleInjuryReports(orgType) {
  const k = String(orgType || "")
    .trim()
    .toLowerCase();
  return k === "vet";
}

export async function createReport({
  userId,
  title,
  description,
  photo_url,
  latitude,
  longitude,
  address_text,
  target_organization_id = null,
}) {
  if (!description || !String(description).trim()) {
    const err = new Error("DESCRIPTION_REQUIRED");
    err.code = "DESCRIPTION_REQUIRED";
    throw err;
  }
  let targetId =
    target_organization_id != null && Number.isFinite(Number(target_organization_id))
      ? Number(target_organization_id)
      : null;
  if (targetId != null) {
    const { rows: chk } = await pool.query(`SELECT id FROM organizations WHERE id = $1`, [targetId]);
    if (!chk[0]) targetId = null;
  }
  const { rows } = await pool.query(
    `INSERT INTO reports (
       user_id, title, description, photo_url, latitude, longitude, address_text, status,
       target_organization_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8) RETURNING *`,
    [
      userId ?? null,
      title?.trim() || null,
      String(description).trim(),
      photo_url?.trim() || null,
      latitude != null ? Number(latitude) : null,
      longitude != null ? Number(longitude) : null,
      address_text?.trim() || null,
      targetId,
    ]
  );
  return rows[0];
}

export async function listReports({ status = null, limit = 100 } = {}) {
  let q = `SELECT r.* FROM reports r WHERE 1=1`;
  const params = [];
  if (status) {
    q += ` AND r.status = $${params.length + 1}`;
    params.push(status);
  }
  const lim = Math.min(Math.max(Number(limit) || 100, 1), 500);
  params.push(lim);
  q += ` ORDER BY r.created_at DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(q, params);
  return rows;
}

/** Community feed: closed cases only, with vet-written summaries (never raw reporter notes). */
export async function listResolvedPublicSummaries({ limit = 100 } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const { rows } = await pool.query(
    `SELECT r.id, r.title, r.public_summary, r.updated_at, r.address_text
     FROM reports r
     WHERE r.status = 'resolved'
       AND r.public_summary IS NOT NULL
       AND LENGTH(TRIM(r.public_summary)) > 0
     ORDER BY r.updated_at DESC NULLS LAST, r.created_at DESC
     LIMIT $1`,
    [lim]
  );
  return rows;
}

export async function getReportById(id) {
  const { rows } = await pool.query(`SELECT * FROM reports WHERE id = $1`, [id]);
  return rows[0] || null;
}

/** Org owner (JWT user id) may update status if report is assigned to their org or unassigned (claim). */
export async function updateReportStatus(actorOwnerUserId, reportId, { status, assignToMyOrg, public_summary }) {
  if (!ALLOWED_STATUS.includes(status)) {
    const err = new Error("INVALID_STATUS");
    err.code = "INVALID_STATUS";
    throw err;
  }
  const org = await getOrganizationByOwnerUserId(actorOwnerUserId);
  if (!org) {
    const err = new Error("NO_ORGANIZATION");
    err.code = "NO_ORGANIZATION";
    throw err;
  }
  if (!organizationCanHandleInjuryReports(org.org_type)) {
    const err = new Error("ORG_REPORTS_RESTRICTED");
    err.code = "ORG_REPORTS_RESTRICTED";
    throw err;
  }
  const report = await getReportById(reportId);
  if (!report) return null;

  const canAct =
    report.assigned_organization_id == null || Number(report.assigned_organization_id) === Number(org.id);
  if (!canAct) {
    const err = new Error("NOT_ASSIGNED_TO_YOUR_ORG");
    err.code = "NOT_ASSIGNED_TO_YOUR_ORG";
    throw err;
  }

  let newAssigned = report.assigned_organization_id;
  if (newAssigned == null && assignToMyOrg) {
    newAssigned = org.id;
  }

  let summaryOut = report.public_summary;
  if (status === "resolved") {
    const incoming = public_summary != null ? String(public_summary).trim() : "";
    if (incoming) {
      summaryOut = incoming.slice(0, 4000);
    } else if (!summaryOut || !String(summaryOut).trim()) {
      const err = new Error("PUBLIC_SUMMARY_REQUIRED");
      err.code = "PUBLIC_SUMMARY_REQUIRED";
      throw err;
    }
  }

  const { rows } = await pool.query(
    `UPDATE reports SET status = $1, assigned_organization_id = $2,
       public_summary = COALESCE($4::text, public_summary),
       updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, newAssigned, reportId, status === "resolved" ? summaryOut : null]
  );
  return rows[0] || null;
}
