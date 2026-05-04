import { Router } from "express";
import { requireAdminJwt } from "../middleware/adminJwt.js";
import * as admin from "../controllers/adminApi.controller.js";

const router = Router();

router.use(requireAdminJwt);

router.get("/org-requests", admin.listPendingOrgRequests);
router.post("/org-requests/:id/approve", admin.approveOrgRequest);
router.post("/org-requests/:id/reject", admin.rejectOrgRequest);

export default router;
