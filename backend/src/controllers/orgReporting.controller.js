import * as repo from "../services/orgReporting.service.js";

function ctxOrg(req) {
  return Number(req.organizationContext?.organizationId);
}

function ctxUser(req) {
  return Number(req.organizationContext?.userId);
}

function portalRole(req) {
  return String(req.organizationContext?.portalRole || "").trim().toLowerCase();
}

function ownerOnly(req, res) {
  if (portalRole(req) !== "org") {
    res.status(403).json({ error: "Only the organization owner can perform this action." });
    return false;
  }
  return true;
}

export async function getSimpleReporting(req, res) {
  const oid = ctxOrg(req);
  try {
    const data = await repo.getSimpleDashboard(oid);
    res.json({ report: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate report." });
  }
}

export async function getPeriodical(req, res) {
  const oid = ctxOrg(req);
  const { from, to } = req.query;
  try {
    const data = await repo.getPeriodicalReport(oid, from, to);
    res.json({ report: data });
  } catch (err) {
    if (err.code === "BAD_FROM" || err.code === "BAD_TO") {
      return res.status(400).json({ error: "Invalid date range." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not generate report." });
  }
}

export async function getDistancing(req, res) {
  const oid = ctxOrg(req);
  try {
    const days = req.query.days != null ? Number(req.query.days) : 90;
    const limit = req.query.limit != null ? Number(req.query.limit) : 80;
    const rows = await repo.getDistancingCustomers(oid, { days_since: days, limit });
    res.json({ customers: rows, idle_days_threshold: Number.isFinite(days) ? days : 90 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load list." });
  }
}

export async function getBusiest(req, res) {
  const oid = ctxOrg(req);
  const { from, to } = req.query;
  try {
    const data = await repo.getBusiestSlots(oid, from, to, { limit: Number(req.query.limit) || undefined });
    res.json({ report: data });
  } catch (err) {
    if (err.code === "BAD_FROM" || err.code === "BAD_TO") return res.status(400).json({ error: "Invalid dates." });
    console.error(err);
    res.status(500).json({ error: "Could not analyze schedule." });
  }
}

export async function getBestsellers(req, res) {
  const oid = ctxOrg(req);
  const { from, to } = req.query;
  try {
    const data = await repo.getBestsellingServices(oid, from, to, { limit: Number(req.query.limit) || undefined });
    res.json({ report: data });
  } catch (err) {
    if (err.code === "BAD_FROM" || err.code === "BAD_TO") return res.status(400).json({ error: "Invalid dates." });
    console.error(err);
    res.status(500).json({ error: "Could not load bestsellers." });
  }
}

export async function getBonusPreview(req, res) {
  const oid = ctxOrg(req);
  const { from, to } = req.query;
  try {
    const data = await repo.getEmployeeBonusPreview(oid, from, to, {
      commission_bp: req.query.commission_bp != null ? Number(req.query.commission_bp) : undefined,
      commission_percent: req.query.commission_percent != null ? Number(req.query.commission_percent) : undefined,
      bonus_per_booking_cents:
        req.query.bonus_per_booking_cents != null ? Number(req.query.bonus_per_booking_cents) : undefined,
    });
    res.json({ report: data });
  } catch (err) {
    if (err.code === "BAD_FROM" || err.code === "BAD_TO") return res.status(400).json({ error: "Invalid dates." });
    console.error(err);
    res.status(500).json({ error: "Could not compute bonuses." });
  }
}

export async function getAdvanced(req, res) {
  const oid = ctxOrg(req);
  try {
    const data = await repo.getAdvancedReport(oid, req.query);
    res.json({ report: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not build advanced bundle." });
  }
}

export async function listLeaves(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await repo.listLeaveRequests(oid);
    res.json({ leave_requests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load leave requests." });
  }
}

export async function createLeave(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await repo.createLeaveRequest(oid, uid, req.body || {});
    res.status(201).json({ leave_request: row });
  } catch (err) {
    if (err.code === "NOT_IN_ORG") return res.status(403).json({ error: "Not a member of this organization." });
    if (err.code === "DATES_REQUIRED") return res.status(400).json({ error: "start_date and end_date required." });
    console.error(err);
    res.status(500).json({ error: "Could not submit leave." });
  }
}

export async function reviewLeave(req, res) {
  if (!ownerOnly(req, res)) return;
  const oid = ctxOrg(req);
  const reviewer = ctxUser(req);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const row = await repo.reviewLeaveRequest(oid, reviewer, id, req.body || {});
    res.json({ leave_request: row });
  } catch (err) {
    if (err.code === "BAD_STATUS") return res.status(400).json({ error: 'status must be "approved" or "rejected".' });
    if (err.code === "NOT_PENDING") return res.status(404).json({ error: "Request not pending." });
    console.error(err);
    res.status(500).json({ error: "Could not update leave." });
  }
}

export async function listWeights(req, res) {
  const oid = ctxOrg(req);
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet." });
  try {
    const rows = await repo.listPetWeights(oid, petId);
    res.json({ weights: rows });
  } catch (err) {
    if (err.code === "PET_ACCESS") return res.status(403).json({ error: "Pet has no bookings with this clinic." });
    console.error(err);
    res.status(500).json({ error: "Could not load weights." });
  }
}

export async function createWeight(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet." });
  try {
    const row = await repo.addPetWeight(oid, uid, petId, req.body || {});
    res.status(201).json({ weight_entry: row });
  } catch (err) {
    if (err.code === "PET_ACCESS") return res.status(403).json({ error: "Pet not on your calendar yet." });
    if (err.code === "BAD_WEIGHT") return res.status(400).json({ error: "Positive weight_kg required." });
    console.error(err);
    res.status(500).json({ error: "Could not save weight." });
  }
}
