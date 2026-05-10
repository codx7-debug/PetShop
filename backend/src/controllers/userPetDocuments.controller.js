import * as clinic from "../services/clinicRecords.service.js";

function requireRealUser(req, res) {
  const id = req.auth?.id;
  if (id == null || id === 0) {
    res.status(403).json({ error: "Not available for this account type." });
    return null;
  }
  return Number(id);
}

export async function ownerListPetDocs(req, res) {
  const ownerId = requireRealUser(req, res);
  if (ownerId == null) return;
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet." });
  try {
    const rows = await clinic.listPetDocuments({ petId, ownerUserId: ownerId });
    if (rows === null) return res.status(404).json({ error: "Pet not found." });
    return res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load documents." });
  }
}

export async function ownerPostPetDoc(req, res) {
  const ownerId = requireRealUser(req, res);
  if (ownerId == null) return;
  const petId = Number.parseInt(req.params.petId, 10);
  if (!Number.isFinite(petId)) return res.status(400).json({ error: "Invalid pet." });
  try {
    const row = await clinic.addPetDocument({
      petId,
      title: req.body?.title,
      fileUrl: req.body?.file_url ?? req.body?.fileUrl,
      notes: req.body?.notes,
      uploadedByUserId: ownerId,
      organizationId: null,
      ownerUserIdAssert: ownerId,
    });
    res.status(201).json({ document: row });
  } catch (err) {
    if (err.code === "DOC_FIELDS") return res.status(400).json({ error: "Title and file URL required." });
    if (err.code === "PET_ACCESS") return res.status(403).json({ error: "You do not own this pet." });
    console.error(err);
    res.status(500).json({ error: "Could not save document." });
  }
}
