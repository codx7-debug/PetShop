import * as reportService from "../services/report.service.js";
import { getOrganizationByOwnerUserId } from "../services/organization.service.js";

function shapePublicReport(row) {
  if (!row) return null;
  const {
    id,
    user_id,
    title,
    description,
    photo_url,
    latitude,
    longitude,
    address_text,
    status,
    assigned_organization_id,
    target_organization_id,
    public_summary,
    created_at,
    updated_at,
  } = row;
  return {
    id,
    user_id,
    title,
    description,
    photo_url,
    latitude,
    longitude,
    address_text,
    status,
    assigned_organization_id,
    target_organization_id: target_organization_id ?? null,
    public_summary: public_summary ?? null,
    created_at,
    updated_at,
  };
}

function shapeCommunityReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    summary: row.public_summary,
    resolved_at: row.updated_at,
    address_text: row.address_text ?? null,
  };
}

export async function postReport(req, res) {
  try {
    const userId = req.auth?.id != null && req.auth.role !== "admin" ? req.auth.id : null;
    const { title, description, photo_url, latitude, longitude, address_text, target_organization_id } =
      req.body || {};
    const row = await reportService.createReport({
      userId: userId ?? null,
      title,
      description,
      photo_url,
      latitude,
      longitude,
      address_text,
      target_organization_id,
    });
    res.status(201).json({ report: shapePublicReport(row) });
  } catch (err) {
    if (err.code === "DESCRIPTION_REQUIRED") {
      return res.status(400).json({ error: "Description is required." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not create report." });
  }
}

/** Full operational list for veterinary org owners (all statuses). */
export async function listReportsForVetOrg(req, res) {
  const ownerId = req.auth.id;
  try {
    const org = await getOrganizationByOwnerUserId(ownerId);
    if (!org) return res.status(404).json({ error: "No organization profile." });
    if (!reportService.organizationCanHandleInjuryReports(org.org_type)) {
      return res.status(403).json({ error: "Injury report management is for veterinary clinics only." });
    }
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    const rows = await reportService.listReports({ limit });
    res.json({ reports: rows.map((r) => shapePublicReport(r)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load reports." });
  }
}

/** Community: closed cases with a public summary only (no live injury details). */
export async function listReportsPublic(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const rows = await reportService.listResolvedPublicSummaries({ limit });
    const shaped = rows.map((r) => shapeCommunityReport(r));
    res.json({ reports: shaped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load reports." });
  }
}

export async function patchReportStatus(req, res) {
  const reportId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(reportId)) return res.status(400).json({ error: "Invalid report id." });
  const { status, assign_to_my_org, public_summary } = req.body || {};
  if (!status || typeof status !== "string") {
    return res.status(400).json({ error: "Body field `status` is required (open | in_progress | resolved)." });
  }
  try {
    const row = await reportService.updateReportStatus(req.auth.id, reportId, {
      status: status.trim(),
      assignToMyOrg: Boolean(assign_to_my_org),
      public_summary,
    });
    if (!row) return res.status(404).json({ error: "Report not found." });
    res.json({ report: shapePublicReport(row) });
  } catch (err) {
    if (err.code === "INVALID_STATUS") {
      return res.status(400).json({ error: "Invalid status. Use open, in_progress, or resolved." });
    }
    if (err.code === "NO_ORGANIZATION") {
      return res.status(403).json({ error: "No organization profile for this account." });
    }
    if (err.code === "NOT_ASSIGNED_TO_YOUR_ORG") {
      return res.status(403).json({ error: "This report is assigned to another organization." });
    }
    if (err.code === "ORG_REPORTS_RESTRICTED") {
      return res.status(403).json({
        error:
          "Injury reports are reserved for veterinary clinic accounts on Petora. Other provider types cannot claim or update them.",
      });
    }
    if (err.code === "PUBLIC_SUMMARY_REQUIRED") {
      return res.status(400).json({
        error:
          "Provide `public_summary` (short outcome for the community) when marking a case resolved.",
      });
    }
    console.error(err);
    res.status(500).json({ error: "Could not update report." });
  }
}
