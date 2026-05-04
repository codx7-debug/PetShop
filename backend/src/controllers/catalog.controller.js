import * as orgService from "../services/organization.service.js";
import * as catalogService from "../services/serviceCatalog.service.js";

function parseGallery(org) {
  if (!org?.gallery_json) return [];
  try {
    const v = JSON.parse(org.gallery_json);
    return Array.isArray(v) ? v.filter((u) => typeof u === "string" && u.trim()) : [];
  } catch {
    return [];
  }
}

function mapPublicOrganization(org) {
  if (!org) return null;
  return {
    id: org.id,
    display_name: org.display_name,
    org_type: org.org_type,
    description: org.description,
    address_line: org.address_line,
    city: org.city,
    country: org.country,
    latitude: org.latitude,
    longitude: org.longitude,
    rating_average:
      org.rating_average != null && Number.isFinite(Number(org.rating_average))
        ? Math.min(5, Math.max(0, Number(org.rating_average)))
        : null,
    rating_count: Math.max(0, Number(org.rating_count) || 0),
    gallery_urls: parseGallery(org),
    created_at: org.created_at,
  };
}

/** Full public profile + active services for customer booking UX. */
export async function getOrganizationPublic(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid organization id." });
  try {
    const org = await orgService.getOrganizationPublicById(id);
    if (!org) return res.status(404).json({ error: "Organization not found." });
    const services = await catalogService.listServicesByOrganizationId(id, { activeOnly: true });
    res.json({ organization: mapPublicOrganization(org), services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load organization." });
  }
}

export async function listOrganizations(req, res) {
  try {
    const orgType = req.query.orgType ? String(req.query.orgType).trim() : null;
    const rows = await orgService.listOrganizationsPublic({ orgType: orgType || null });
    res.json({ organizations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load organizations." });
  }
}

/** Map pins: vets with coordinates — verified (active owner) vs pending listings. */
export async function listOrganizationsMap(req, res) {
  try {
    const organizations = await orgService.listVeterinaryOrganizationsForMap();
    res.json({ organizations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load provider map." });
  }
}

export async function listServicesForOrganization(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid organization id." });
  try {
    const org = await orgService.getOrganizationById(id);
    if (!org) return res.status(404).json({ error: "Organization not found." });
    const rows = await catalogService.listServicesByOrganizationId(id, { activeOnly: true });
    res.json({ services: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load services." });
  }
}
