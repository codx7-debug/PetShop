import { Router } from "express";
import { requireAuthJwt } from "../middleware/authJwt.js";
import * as auth from "../controllers/authApi.controller.js";

const router = Router();

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/change-password", requireAuthJwt, auth.changePassword);

export default router;
