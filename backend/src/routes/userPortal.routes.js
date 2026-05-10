import { Router } from "express";
import { requireAuthJwtNotAccounter } from "../middleware/authJwt.js";
import * as ctrl from "../controllers/userPortal.controller.js";
import * as petDocCtrl from "../controllers/userPetDocuments.controller.js";

const router = Router();

router.get("/adoption-listings", ctrl.listAdoptionListingsPublic);
router.get("/adoption-listings/:id", ctrl.getAdoptionListingPublic);

/** Per-route JWT only: a global `router.use(requireAuthJwt)` would intercept public `/api/organizations`. */
router.get("/me", requireAuthJwtNotAccounter, ctrl.getMe);
router.put("/me", requireAuthJwtNotAccounter, ctrl.putMe);

router.get("/me/pets", requireAuthJwtNotAccounter, ctrl.listMyPets);
router.post("/me/adoption-listings", requireAuthJwtNotAccounter, ctrl.postMyAdoptionListing);
router.get("/me/adoption-listings", requireAuthJwtNotAccounter, ctrl.listMyAdoptionListings);
router.delete("/me/adoption-listings/:id", requireAuthJwtNotAccounter, ctrl.deleteMyAdoptionListing);
router.delete("/me/account", requireAuthJwtNotAccounter, ctrl.deleteMyAccount);
router.post("/me/pets", requireAuthJwtNotAccounter, ctrl.postMyPet);
router.patch("/me/pets/:id", requireAuthJwtNotAccounter, ctrl.patchMyPet);
router.get("/me/vaccine-wizard", requireAuthJwtNotAccounter, ctrl.getVaccineWizardSuggestions);
router.get("/me/pets/:petId/vaccinations", requireAuthJwtNotAccounter, ctrl.listPetVaccinations);
router.post("/me/pets/:petId/vaccinations", requireAuthJwtNotAccounter, ctrl.postPetVaccination);
router.delete("/me/pet-vaccinations/:id", requireAuthJwtNotAccounter, ctrl.deletePetVaccination);

router.get("/me/pets/:petId/documents", requireAuthJwtNotAccounter, petDocCtrl.ownerListPetDocs);
router.post("/me/pets/:petId/documents", requireAuthJwtNotAccounter, petDocCtrl.ownerPostPetDoc);
router.post("/me/commercial-consent", requireAuthJwtNotAccounter, ctrl.postMyCommercialConsent);

router.get("/me/payment/cards", requireAuthJwtNotAccounter, ctrl.listMyCards);
router.get("/me/payment/transactions", requireAuthJwtNotAccounter, ctrl.listMyTransactions);
router.post("/me/payment/cards", requireAuthJwtNotAccounter, ctrl.postMyCard);

router.get("/me/catalog/favorites", requireAuthJwtNotAccounter, ctrl.listMyCatalogFavorites);
router.get("/me/catalog/recent", requireAuthJwtNotAccounter, ctrl.listMyCatalogRecent);
router.post("/me/catalog/favorites", requireAuthJwtNotAccounter, ctrl.postMyCatalogFavorite);
router.delete("/me/catalog/favorites/:organizationId", requireAuthJwtNotAccounter, ctrl.deleteMyCatalogFavorite);

router.get("/me/notifications", requireAuthJwtNotAccounter, ctrl.listMyNotifications);
router.patch("/me/notifications/:id/read", requireAuthJwtNotAccounter, ctrl.patchNotificationRead);

export default router;
