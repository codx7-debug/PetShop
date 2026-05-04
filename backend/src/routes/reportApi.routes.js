import { Router } from "express";
import { optionalAuthJwt } from "../middleware/authJwt.js";
import * as ctrl from "../controllers/reportApi.controller.js";

const router = Router();

router.get("/reports", ctrl.listReportsPublic);
router.post("/reports", optionalAuthJwt, ctrl.postReport);

export default router;
