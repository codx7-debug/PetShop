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
router.post("/broadcasts", ctrl.postBroadcast);
router.get("/members", ctrl.listMyMembers);
router.post("/members", ctrl.postMyMember);
router.delete("/members/:userId", ctrl.deleteMyMember);
router.get("/packages", ctrl.listMyPackages);
router.post("/packages", ctrl.postMyPackage);
router.patch("/packages/:id", ctrl.patchMyPackage);
router.put("/packages/:id/items", ctrl.putMyPackageItems);
router.get("/inventory", ctrl.listMyInventory);
router.post("/inventory", ctrl.upsertInventory);
router.delete("/inventory/:id", ctrl.deleteInventory);
router.get("/waitlist", ctrl.listMyWaitlist);
router.post("/appointments/:id/mark-no-show", ctrl.patchAppointmentNoShow);
router.patch("/reports/:id/status", reportCtrl.patchReportStatus);

export default router;
