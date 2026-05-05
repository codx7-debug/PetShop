import { Router } from "express";
import { requireAuthJwt } from "../middleware/authJwt.js";
import * as ctrl from "../controllers/catalog.controller.js";

const router = Router();

router.get("/organizations/map", ctrl.listOrganizationsMap);
router.get("/organizations", ctrl.listOrganizations);
router.get("/organizations/:id/services", ctrl.listServicesForOrganization);
router.get("/organizations/:id/packages", ctrl.listPackagesForOrganization);
router.get("/organizations/:id/reviews", ctrl.listReviewsForOrganization);
router.post("/organizations/:id/recent-view", requireAuthJwt, ctrl.recordOrgRecentView);
router.post("/organizations/:id/reviews", requireAuthJwt, ctrl.createOrgReview);
router.get("/organizations/:id", ctrl.getOrganizationPublic);

export default router;
