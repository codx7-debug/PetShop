import { Router } from "express";
import * as ctrl from "../controllers/catalog.controller.js";

const router = Router();

router.get("/organizations/map", ctrl.listOrganizationsMap);
router.get("/organizations", ctrl.listOrganizations);
router.get("/organizations/:id/services", ctrl.listServicesForOrganization);
router.get("/organizations/:id", ctrl.getOrganizationPublic);

export default router;
