import { Router } from "express";
import { requireOrgJwt } from "../middleware/authJwt.js";
import * as ctrl from "../controllers/orgPortal.controller.js";
import * as reportCtrl from "../controllers/reportApi.controller.js";

const router = Router();

router.use(requireOrgJwt);

router.get("/reports", reportCtrl.listReportsForVetOrg);

router.get("/me", ctrl.getMyOrganization);
router.put("/me", ctrl.putMyOrganization);
router.get("/services", ctrl.listMyServices);
router.post("/services", ctrl.postMyService);
router.patch("/services/:id", ctrl.patchMyService);
router.get("/appointments", ctrl.listMyAppointments);
router.patch("/reports/:id/status", reportCtrl.patchReportStatus);

export default router;
