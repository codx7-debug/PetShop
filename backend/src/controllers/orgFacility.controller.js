import * as facilityService from "../services/facility.service.js";

function ctxOrg(req) {
  return Number(req.organizationContext?.organizationId);
}

function ctxUser(req) {
  return Number(req.organizationContext?.userId);
}

export async function listVisitors(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await facilityService.listVisitors(oid);
    res.json({ visitors: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load visitors." });
  }
}

export async function postVisitor(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await facilityService.createVisitor(oid, uid, req.body || {});
    res.status(201).json({ visitor: row });
  } catch (err) {
    if (err.code === "VISITOR_NAME_REQUIRED") {
      return res.status(400).json({ error: "Visitor name is required." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not save visitor." });
  }
}

export async function listInterviews(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await facilityService.listInterviewLogs(oid);
    res.json({ interviews: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load interviews." });
  }
}

export async function postInterview(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await facilityService.createInterviewLog(oid, uid, req.body || {});
    res.status(201).json({ interview: row });
  } catch (err) {
    if (err.code === "SUBJECT_REQUIRED") {
      return res.status(400).json({ error: "Subject name is required." });
    }
    if (err.code === "SUMMARY_OR_URI_REQUIRED") {
      return res.status(400).json({ error: "Add summary notes or a recording link URL." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not save interview." });
  }
}

export async function listLodgingUnits(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await facilityService.listAccommodationUnits(oid);
    res.json({ units: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load lodging units." });
  }
}

export async function postLodgingUnit(req, res) {
  const oid = ctxOrg(req);
  try {
    const row = await facilityService.createAccommodationUnit(oid, req.body || {});
    if (!row) return res.status(409).json({ error: "A unit with that label already exists." });
    res.status(201).json({ unit: row });
  } catch (err) {
    if (err.code === "UNIT_LABEL_REQUIRED") {
      return res.status(400).json({ error: "Unit label required." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not create unit." });
  }
}

export async function patchLodgingUnit(req, res) {
  const oid = ctxOrg(req);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid unit id." });
  try {
    const row = await facilityService.patchAccommodationUnit(oid, id, req.body || {});
    if (!row) return res.status(404).json({ error: "Unit not found." });
    res.json({ unit: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update unit." });
  }
}

export async function listLodgingStays(req, res) {
  const oid = ctxOrg(req);
  const from = req.query.from ? String(req.query.from).trim() : null;
  const to = req.query.to ? String(req.query.to).trim() : null;
  try {
    const rows = await facilityService.listAccommodationStays(oid, { fromDate: from, toDate: to });
    res.json({ stays: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load stays." });
  }
}

export async function postLodgingStay(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await facilityService.createAccommodationStay(oid, uid, req.body || {});
    res.status(201).json({ stay: row });
  } catch (err) {
    if (err.code === "DATES_REQUIRED") {
      return res.status(400).json({ error: "check_in_date and check_out_date required." });
    }
    if (err.code === "PET_OR_GUEST_REQUIRED") {
      return res.status(400).json({ error: "Provide pet_id or guest_name." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not create stay." });
  }
}

export async function patchLodgingStay(req, res) {
  const oid = ctxOrg(req);
  const sid = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(sid)) return res.status(400).json({ error: "Invalid stay id." });
  const status = String(req.body?.status || "").trim();
  try {
    const row = await facilityService.updateAccommodationStayStatus(oid, sid, status);
    if (!row) return res.status(404).json({ error: "Stay not found." });
    res.json({ stay: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update stay." });
  }
}

export async function listOrgRecordedVaccinations(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await facilityService.listVaccinationsByOrg(oid);
    res.json({ vaccinations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load vaccinations." });
  }
}

export async function postOrgPetVaccination(req, res) {
  const oid = ctxOrg(req);
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet id." });
  try {
    const row = await facilityService.recordOrgVaccination(oid, petId, req.body || {});
    res.status(201).json({ vaccination: row });
  } catch (err) {
    if (err.code === "PET_NOT_FOUND") return res.status(404).json({ error: "Pet not found." });
    if (err.code === "VACC_FIELDS") {
      return res.status(400).json({ error: "vaccine_name and administered_on required." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not record vaccination." });
  }
}

export async function deleteOrgVaccination(req, res) {
  const oid = ctxOrg(req);
  const vid = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(vid)) return res.status(400).json({ error: "Invalid id." });
  try {
    const ok = await facilityService.deleteVaccinationForOrg(vid, oid);
    if (!ok) return res.status(404).json({ error: "Not found or not recorded by this org." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete." });
  }
}
