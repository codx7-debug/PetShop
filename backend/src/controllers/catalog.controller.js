import * as orgService from "../services/organization.service.js";
import * as catalogService from "../services/serviceCatalog.service.js";
import * as packageService from "../services/servicePackage.service.js";
import * as discoveryService from "../services/discovery.service.js";

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
    const [services, packages] = await Promise.all([
      catalogService.listServicesByOrganizationId(id, { activeOnly: true }),
      packageService.listPackagesByOrganizationId(id, { activeOnly: true }),
    ]);
    res.json({ organization: mapPublicOrganization(org), services, packages });
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
    const org = await orgService.getOrganizationPublicById(id);
    if (!org) return res.status(404).json({ error: "Organization not found." });
    const rows = await catalogService.listServicesByOrganizationId(id, { activeOnly: true });
    res.json({ services: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load services." });
  }
}

export async function listPackagesForOrganization(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid organization id." });
  try {
    const org = await orgService.getOrganizationPublicById(id);
    if (!org) return res.status(404).json({ error: "Organization not found." });
    const rows = await packageService.listPackagesByOrganizationId(id, { activeOnly: true });
    res.json({ packages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load packages." });
  }
}

export async function listReviewsForOrganization(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid organization id." });
  const limit = req.query.limit ? Number(req.query.limit) : 40;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  try {
    const org = await orgService.getOrganizationPublicById(id);
    if (!org) return res.status(404).json({ error: "Organization not found." });
    const reviews = await discoveryService.listReviewsForOrganization(id, { limit, offset });
    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load reviews." });
  }
}

export async function recordOrgRecentView(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid organization id." });
  try {
    const uid = Number(req.auth?.id);
    if (!Number.isFinite(uid) || uid <= 0) {
      return res.status(401).json({ error: "Sign in to track recently viewed salons." });
    }
    await discoveryService.recordRecentOrganizationView(uid, id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save." });
  }
}

export async function createOrgReview(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid organization id." });
  const uid = Number(req.auth?.id);
  if (!Number.isFinite(uid) || uid <= 0) return res.status(403).json({ error: "Sign in required." });
  try {
    const org = await orgService.getOrganizationPublicById(id);
    if (!org) return res.status(404).json({ error: "Organization not found." });
    const body = req.body || {};
    const review = await discoveryService.upsertReviewForOrganization({
      userId: uid,
      organizationId: id,
      rating: body.rating,
      title: body.title,
      body: body.body,
      photo_urls: body.photo_urls,
    });
    if (!review) return res.status(400).json({ error: "Rating 1–5 required." });
    res.status(201).json({ review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save review." });
  }
}
