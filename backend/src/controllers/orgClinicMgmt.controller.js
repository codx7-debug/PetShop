import * as clinic from "../services/clinicRecords.service.js";

function ctxOrg(req) {
  return Number(req.organizationContext?.organizationId);
}

function ctxUser(req) {
  return Number(req.organizationContext?.userId);
}

export async function orgListPatients(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await clinic.listOrgPatients(oid);
    res.json({ patients: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load patients." });
  }
}

export async function orgListCustomers(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await clinic.listOrgCustomers(oid);
    res.json({ customers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load customers." });
  }
}

export async function orgListPetDocuments(req, res) {
  const oid = ctxOrg(req);
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet." });
  try {
    const rows = await clinic.listPetDocuments({ petId, orgId: oid });
    res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load documents." });
  }
}

export async function orgPostPetDocument(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet." });
  try {
    const ok = await clinic.orgHasSeenPet(oid, petId);
    if (!ok) return res.status(403).json({ error: "No bookings found for this pet." });
    const row = await clinic.addPetDocument({
      petId,
      title: req.body?.title,
      fileUrl: req.body?.file_url ?? req.body?.fileUrl,
      notes: req.body?.notes,
      uploadedByUserId: uid,
      organizationId: oid,
    });
    res.status(201).json({ document: row });
  } catch (err) {
    if (err.code === "DOC_FIELDS") return res.status(400).json({ error: "Title and file URL required." });
    console.error(err);
    res.status(500).json({ error: "Could not save document." });
  }
}

export async function orgListCustomerDocuments(req, res) {
  const oid = ctxOrg(req);
  const cid = Number.parseInt(req.params.customerUserId, 10);
  if (!Number.isFinite(cid)) return res.status(400).json({ error: "Invalid customer." });
  try {
    const known = await clinic.assertOrgKnowsCustomer(oid, cid);
    if (!known) return res.status(403).json({ error: "No booking history with this customer." });
    const rows = await clinic.listCustomerDocuments(oid, cid);
    res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load documents." });
  }
}

export async function orgPostCustomerDocument(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  const cid = Number.parseInt(req.params.customerUserId, 10);
  if (!Number.isFinite(cid)) return res.status(400).json({ error: "Invalid customer." });
  try {
    const known = await clinic.assertOrgKnowsCustomer(oid, cid);
    if (!known) return res.status(403).json({ error: "No booking history with this customer." });
    const row = await clinic.addCustomerDocument({
      organizationId: oid,
      customerUserId: cid,
      title: req.body?.title,
      fileUrl: req.body?.file_url ?? req.body?.fileUrl,
      notes: req.body?.notes,
      uploadedByUserId: uid,
    });
    res.status(201).json({ document: row });
  } catch (err) {
    if (err.code === "DOC_FIELDS") return res.status(400).json({ error: "Title and file URL required." });
    console.error(err);
    res.status(500).json({ error: "Could not save document." });
  }
}

export async function orgListInspections(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await clinic.listInspections(oid);
    res.json({ inspections: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load inspections." });
  }
}

export async function orgPostInspection(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await clinic.addInspection(oid, uid, req.body || {});
    res.status(201).json({ inspection: row });
  } catch (err) {
    if (err.code === "PET_ACCESS") return res.status(403).json({ error: "Pet must have a booking here." });
    if (err.code === "INSPECTION_NEEDS_PAYLOAD") {
      return res.status(400).json({ error: "Add findings and/or link a pet id or appointment id." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not save inspection." });
  }
}

export async function orgListConsentLedger(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await clinic.listConsentEventsForOrgCustomers(oid);
    res.json({ consents: rows, note: "Local audit trail only — wire to national IYS APIs separately if required." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load consent log." });
  }
}

export async function orgPostCustomerConsent(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  const customerId = Number.parseInt(req.body?.customer_user_id ?? req.body?.customerUserId, 10);
  if (!Number.isFinite(customerId)) {
    return res.status(400).json({ error: "customer_user_id required." });
  }
  try {
    const known = await clinic.assertOrgKnowsCustomer(oid, customerId);
    if (!known) return res.status(403).json({ error: "No booking history with this customer." });
    const row = await clinic.recordConsent({
      userId: customerId,
      organizationId: oid,
      optedIn: Boolean(req.body?.opted_in ?? req.body?.optedIn),
      channel: req.body?.channel || "commercial",
      source: req.body?.source || "clinic_desk",
      notes: req.body?.notes,
      recordedByUserId: uid,
    });
    res.status(201).json({ consent: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not record consent." });
  }
}
