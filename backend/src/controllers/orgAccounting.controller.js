import * as acct from "../services/orgAccounting.service.js";

function ctxOrg(req) {
  return Number(req.organizationContext?.organizationId);
}

function ctxUser(req) {
  return Number(req.organizationContext?.userId);
}

export async function listCategories(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await acct.listCategories(oid);
    res.json({ categories: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load categories." });
  }
}

export async function postCategory(req, res) {
  const oid = ctxOrg(req);
  try {
    const row = await acct.createCategory(oid, req.body || {});
    res.status(201).json({ category: row });
  } catch (err) {
    if (err.code === "NAME_REQUIRED") return res.status(400).json({ error: "Name required." });
    if (err.code === "DUPLICATE_CATEGORY") return res.status(409).json({ error: "Category exists." });
    console.error(err);
    res.status(500).json({ error: "Could not create category." });
  }
}

export async function listLedger(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await acct.listLedgerLines(oid, {
      limit: req.query.limit,
      from: req.query.from,
      to: req.query.to,
    });
    res.json({ lines: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load ledger." });
  }
}

export async function postLedgerLine(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await acct.addLedgerLine(oid, uid, req.body || {});
    res.status(201).json({ line: row });
  } catch (err) {
    if (err.code === "BAD_FLOW") return res.status(400).json({ error: 'flow must be "in" or "out".' });
    if (err.code === "BAD_AMOUNT") return res.status(400).json({ error: "Positive amount_cents required." });
    console.error(err);
    res.status(500).json({ error: "Could not add line." });
  }
}

export async function listPurchases(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await acct.listPurchases(oid, { limit: req.query.limit });
    res.json({ purchases: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load purchases." });
  }
}

export async function getPurchase(req, res) {
  const oid = ctxOrg(req);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const row = await acct.getPurchase(oid, id);
    if (!row) return res.status(404).json({ error: "Not found." });
    res.json({ purchase: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load purchase." });
  }
}

export async function postPurchase(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await acct.createPurchase(oid, uid, req.body || {});
    res.status(201).json({ purchase: row });
  } catch (err) {
    if (err.code === "LINES_REQUIRED") return res.status(400).json({ error: "At least one line required." });
    if (err.code === "BAD_INV_ITEM") return res.status(400).json({ error: "Inventory item invalid for org." });
    console.error(err);
    res.status(500).json({ error: "Could not save purchase." });
  }
}

export async function listSales(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await acct.listSales(oid, { limit: req.query.limit });
    res.json({ sales: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load sales." });
  }
}

export async function getSale(req, res) {
  const oid = ctxOrg(req);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id." });
  try {
    const row = await acct.getSale(oid, id);
    if (!row) return res.status(404).json({ error: "Not found." });
    res.json({ sale: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load sale." });
  }
}

export async function postSale(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await acct.createSale(oid, uid, req.body || {});
    res.status(201).json({ sale: row });
  } catch (err) {
    if (err.code === "LINES_REQUIRED") return res.status(400).json({ error: "At least one line required." });
    if (err.code === "CUSTOMER_REQUIRED_FOR_CREDIT") {
      return res.status(400).json({ error: "Customer required when posting unpaid balance." });
    }
    if (err.code === "UNKNOWN_CUSTOMER") return res.status(403).json({ error: "No booking history with this customer." });
    if (err.code === "INSUFFICIENT_STOCK") return res.status(409).json({ error: "Insufficient stock." });
    console.error(err);
    res.status(500).json({ error: "Could not save sale." });
  }
}

export async function scanInventorySku(req, res) {
  const oid = ctxOrg(req);
  const sku = req.query.sku ?? req.query.q ?? req.query.barcode;
  try {
    const out = await acct.findInventoryBySku(oid, sku);
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lookup failed." });
  }
}

export async function listDebtors(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await acct.listDebtors(oid);
    res.json({ debtors: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load balances." });
  }
}

export async function getCustomerStatement(req, res) {
  const oid = ctxOrg(req);
  const cid = Number.parseInt(req.params.customerUserId, 10);
  if (!Number.isFinite(cid)) return res.status(400).json({ error: "Invalid customer." });
  try {
    const data = await acct.customerStatement(oid, cid, { from: req.query.from, to: req.query.to });
    res.json({ statement: data });
  } catch (err) {
    if (err.code === "UNKNOWN_CUSTOMER") return res.status(403).json({ error: "No booking history." });
    console.error(err);
    res.status(500).json({ error: "Could not load statement." });
  }
}

export async function postCustomerCharge(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  const cid = Number.parseInt(req.params.customerUserId, 10);
  if (!Number.isFinite(cid)) return res.status(400).json({ error: "Invalid customer." });
  try {
    const row = await acct.postCustomerCharge(oid, uid, cid, req.body || {});
    res.status(201).json({ charge: row });
  } catch (err) {
    if (err.code === "BAD_AMOUNT") return res.status(400).json({ error: "Positive amount_cents required." });
    if (err.code === "UNKNOWN_CUSTOMER") return res.status(403).json({ error: "No booking history." });
    console.error(err);
    res.status(500).json({ error: "Could not add charge." });
  }
}

export async function postCustomerPayment(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  const cid = Number.parseInt(req.params.customerUserId, 10);
  if (!Number.isFinite(cid)) return res.status(400).json({ error: "Invalid customer." });
  try {
    const row = await acct.postCustomerPayment(oid, uid, cid, req.body || {});
    res.status(201).json({ payment: row });
  } catch (err) {
    if (err.code === "BAD_AMOUNT") return res.status(400).json({ error: "Positive amount_cents required." });
    if (err.code === "UNKNOWN_CUSTOMER") return res.status(403).json({ error: "No booking history." });
    console.error(err);
    res.status(500).json({ error: "Could not record payment." });
  }
}

export async function listTillSessions(req, res) {
  const oid = ctxOrg(req);
  try {
    const rows = await acct.listTillSessions(oid, { limit: req.query.limit });
    const open = await acct.getOpenTill(oid);
    res.json({ sessions: rows, open_session: open });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load till." });
  }
}

export async function postTillOpen(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  try {
    const row = await acct.openTillSession(oid, uid, req.body || {});
    res.status(201).json({ session: row });
  } catch (err) {
    if (err.code === "TILL_ALREADY_OPEN") return res.status(409).json({ error: "Close the open till first." });
    console.error(err);
    res.status(500).json({ error: "Could not open till." });
  }
}

export async function postTillClose(req, res) {
  const oid = ctxOrg(req);
  const uid = ctxUser(req);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid session." });
  try {
    const row = await acct.closeTillSession(oid, uid, id, req.body || {});
    res.json({ session: row });
  } catch (err) {
    if (err.code === "BAD_COUNTED") return res.status(400).json({ error: "closing_counted_cents required." });
    if (err.code === "SESSION_NOT_OPEN") return res.status(404).json({ error: "Session not open." });
    console.error(err);
    res.status(500).json({ error: "Could not close till." });
  }
}
