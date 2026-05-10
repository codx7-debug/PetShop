import * as svc from "../services/accounterPortal.service.js";

export async function getSummary(req, res) {
  try {
    const days = req.query.days != null ? Number(req.query.days) : undefined;
    const summary = await svc.getGlobalFinanceSummary({ windowDays: days });
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load summary." });
  }
}

export async function listSales(req, res) {
  try {
    const limit = Number(req.query.limit);
    const organization_id = req.query.organization_id ?? req.query.org;
    const rows = await svc.listGlobalRecentSales({ limit: Number.isFinite(limit) ? limit : undefined, organization_id });
    res.json({ sales: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load sales." });
  }
}

export async function listPurchases(req, res) {
  try {
    const limit = Number(req.query.limit);
    const organization_id = req.query.organization_id ?? req.query.org;
    const rows = await svc.listGlobalRecentPurchases({ limit: Number.isFinite(limit) ? limit : undefined, organization_id });
    res.json({ purchases: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load purchases." });
  }
}

export async function listReceivables(req, res) {
  try {
    const rows = await svc.listReceivablesByOrganization();
    res.json({ receivables_by_org: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load receivables." });
  }
}

export async function listOrganizations(req, res) {
  try {
    const rows = await svc.listOrganizationsForFilter();
    res.json({ organizations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load organizations." });
  }
}

export async function listLedger(req, res) {
  try {
    const limit = Number(req.query.limit);
    const rows = await svc.listRecentLedgerFlows({ limit: Number.isFinite(limit) ? limit : undefined });
    res.json({ ledger_lines: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load ledger." });
  }
}
