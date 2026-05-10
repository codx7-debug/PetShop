import { Router } from "express";
import { requireAccounterOrAdminJwt } from "../middleware/accounterJwt.js";
import * as ctrl from "../controllers/accounterPortal.controller.js";

const router = Router();

router.use(requireAccounterOrAdminJwt);

router.get("/finance/summary", ctrl.getSummary);
router.get("/finance/sales", ctrl.listSales);
router.get("/finance/purchases", ctrl.listPurchases);
router.get("/finance/receivables", ctrl.listReceivables);
router.get("/finance/ledger-lines", ctrl.listLedger);
router.get("/organizations", ctrl.listOrganizations);

export default router;
