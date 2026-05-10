import { Router } from "express";
import { requireAdminJwt } from "../middleware/adminJwt.js";
import * as admin from "../controllers/adminApi.controller.js";

const router = Router();

router.use(requireAdminJwt);

router.get("/org-requests", admin.listPendingOrgRequests);
router.post("/org-requests/:id/approve", admin.approveOrgRequest);
router.post("/org-requests/:id/reject", admin.rejectOrgRequest);

router.get("/accounts/search", admin.searchAccounts);
router.patch("/accounts/:id/status", admin.patchAccountStatus);
router.delete("/accounts/:id", admin.deleteAccountAdmin);

router.get("/accounter-users", admin.listAccounterUsers);
router.post("/accounter-users", admin.createAccounterUser);
router.patch("/accounter-users/:id", admin.patchAccounterUser);

export default router;
