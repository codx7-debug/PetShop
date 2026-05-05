import { Router } from "express";
import { requireAuthJwt } from "../middleware/authJwt.js";
import * as ctrl from "../controllers/userPortal.controller.js";

const router = Router();

/** Per-route JWT only: a global `router.use(requireAuthJwt)` would intercept public `/api/organizations`. */
router.get("/me", requireAuthJwt, ctrl.getMe);
router.put("/me", requireAuthJwt, ctrl.putMe);

router.get("/me/pets", requireAuthJwt, ctrl.listMyPets);
router.post("/me/pets", requireAuthJwt, ctrl.postMyPet);
router.patch("/me/pets/:id", requireAuthJwt, ctrl.patchMyPet);

router.get("/me/payment/cards", requireAuthJwt, ctrl.listMyCards);
router.get("/me/payment/transactions", requireAuthJwt, ctrl.listMyTransactions);
router.post("/me/payment/cards", requireAuthJwt, ctrl.postMyCard);

router.get("/me/catalog/favorites", requireAuthJwt, ctrl.listMyCatalogFavorites);
router.get("/me/catalog/recent", requireAuthJwt, ctrl.listMyCatalogRecent);
router.post("/me/catalog/favorites", requireAuthJwt, ctrl.postMyCatalogFavorite);
router.delete("/me/catalog/favorites/:organizationId", requireAuthJwt, ctrl.deleteMyCatalogFavorite);

router.get("/me/notifications", requireAuthJwt, ctrl.listMyNotifications);
router.patch("/me/notifications/:id/read", requireAuthJwt, ctrl.patchNotificationRead);

export default router;
