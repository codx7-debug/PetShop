import pool from "../config/db.js";
import { resolveOrgIdFromOwnerUserId } from "./servicePackage.service.js";

export async function listInventory(ownerUserId) {
  const orgId = await resolveOrgIdFromOwnerUserId(ownerUserId);
  if (!orgId) return null;
  const { rows } = await pool.query(`SELECT * FROM org_inventory_items WHERE organization_id = $1 ORDER BY name`, [
    orgId,
  ]);
  return rows;
}

export async function upsertInventoryItem(ownerUserId, body) {
  const orgId = await resolveOrgIdFromOwnerUserId(ownerUserId);
  if (!orgId) return null;
  const id = body.id != null ? Number(body.id) : null;
  const name = String(body.name || "").trim();
  if (!name) return null;
  if (Number.isFinite(id) && id > 0) {
    const cols = [["name", name]];
    if (body.sku !== undefined) cols.push(["sku", body.sku?.trim() || null]);
    if (body.quantity !== undefined && Number.isFinite(Number(body.quantity))) {
      cols.push(["quantity", Number(body.quantity)]);
    }
    if (body.unit !== undefined) cols.push(["unit", body.unit?.trim() || "unit"]);
    if (body.low_stock_threshold !== undefined) {
      cols.push([
        "low_stock_threshold",
        body.low_stock_threshold == null || body.low_stock_threshold === ""
          ? null
          : Number(body.low_stock_threshold),
      ]);
    }
    const params = cols.map(([, v]) => v);
    params.push(id, orgId);
    const setFrag = cols.map(([k], j) => `${k} = $${j + 1}`).join(", ");
    const idPh = cols.length + 1;
    const orgPh = cols.length + 2;
    const { rows } = await pool.query(
      `UPDATE org_inventory_items SET ${setFrag}, updated_at = NOW() WHERE id = $${idPh} AND organization_id = $${orgPh} RETURNING *`,
      params
    );
    return rows[0] || null;
  }
  const { rows } = await pool.query(
    `INSERT INTO org_inventory_items (organization_id, sku, name, quantity, unit, low_stock_threshold)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      orgId,
      body.sku?.trim() || null,
      name,
      body.quantity != null ? Number(body.quantity) : 0,
      body.unit?.trim() || "unit",
      body.low_stock_threshold != null ? Number(body.low_stock_threshold) : null,
    ]
  );
  return rows[0] || null;
}

export async function deleteInventoryItem(ownerUserId, itemId) {
  const orgId = await resolveOrgIdFromOwnerUserId(ownerUserId);
  if (!orgId) return false;
  const { rowCount } = await pool.query(`DELETE FROM org_inventory_items WHERE id = $1 AND organization_id = $2`, [
    itemId,
    orgId,
  ]);
  return rowCount > 0;
}
