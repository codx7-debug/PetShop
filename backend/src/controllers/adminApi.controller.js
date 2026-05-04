import * as userDb from "../services/userDb.service.js";

export async function listPendingOrgRequests(_req, res) {
  try {
    const rows = await userDb.listPendingOrgRequests();
    res.json({ requests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load requests." });
  }
}

export async function approveOrgRequest(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const row = await userDb.setOrgRequestStatus(id, "active");
    if (!row) return res.status(404).json({ error: "No pending organization request with that id." });
    res.json({ user: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not approve request." });
  }
}

export async function rejectOrgRequest(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const row = await userDb.setOrgRequestStatus(id, "rejected");
    if (!row) return res.status(404).json({ error: "No pending organization request with that id." });
    res.json({ user: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reject request." });
  }
}
