import { Router } from "express";
import { requireOrgJwt } from "../middleware/authJwt.js";
import * as ctrl from "../controllers/orgPortal.controller.js";
import * as facCtrl from "../controllers/orgFacility.controller.js";
import * as reportCtrl from "../controllers/reportApi.controller.js";
import * as clinicCtrl from "../controllers/orgClinicMgmt.controller.js";
import * as acctCtrl from "../controllers/orgAccounting.controller.js";
import * as reportDashCtrl from "../controllers/orgReporting.controller.js";

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
router.get("/offers", ctrl.listMyOffers);
router.post("/offers", ctrl.postMyOffer);
router.patch("/offers/:id", ctrl.patchMyOffer);
router.delete("/offers/:id", ctrl.deleteMyOffer);
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

router.get("/facility/visitors", facCtrl.listVisitors);
router.post("/facility/visitors", facCtrl.postVisitor);
router.get("/facility/interviews", facCtrl.listInterviews);
router.post("/facility/interviews", facCtrl.postInterview);
router.get("/facility/lodging/units", facCtrl.listLodgingUnits);
router.post("/facility/lodging/units", facCtrl.postLodgingUnit);
router.patch("/facility/lodging/units/:id", facCtrl.patchLodgingUnit);
router.get("/facility/lodging/stays", facCtrl.listLodgingStays);
router.post("/facility/lodging/stays", facCtrl.postLodgingStay);
router.patch("/facility/lodging/stays/:id", facCtrl.patchLodgingStay);
router.get("/facility/vaccinations", facCtrl.listOrgRecordedVaccinations);
router.post("/facility/pets/:petId/vaccinations", facCtrl.postOrgPetVaccination);
router.delete("/facility/vaccinations/:id", facCtrl.deleteOrgVaccination);

router.get("/clinic/patients", clinicCtrl.orgListPatients);
router.get("/clinic/customers", clinicCtrl.orgListCustomers);
router.get("/clinic/pets/:petId/documents", clinicCtrl.orgListPetDocuments);
router.post("/clinic/pets/:petId/documents", clinicCtrl.orgPostPetDocument);
router.get("/clinic/customers/:customerUserId/documents", clinicCtrl.orgListCustomerDocuments);
router.post("/clinic/customers/:customerUserId/documents", clinicCtrl.orgPostCustomerDocument);
router.get("/clinic/inspections", clinicCtrl.orgListInspections);
router.post("/clinic/inspections", clinicCtrl.orgPostInspection);
router.get("/clinic/consents", clinicCtrl.orgListConsentLedger);
router.post("/clinic/consents", clinicCtrl.orgPostCustomerConsent);

router.get("/accounting/categories", acctCtrl.listCategories);
router.post("/accounting/categories", acctCtrl.postCategory);
router.get("/accounting/ledger", acctCtrl.listLedger);
router.post("/accounting/ledger", acctCtrl.postLedgerLine);
router.get("/accounting/purchases", acctCtrl.listPurchases);
router.get("/accounting/purchases/:id", acctCtrl.getPurchase);
router.post("/accounting/purchases", acctCtrl.postPurchase);
router.get("/accounting/sales", acctCtrl.listSales);
router.get("/accounting/sales/:id", acctCtrl.getSale);
router.post("/accounting/sales", acctCtrl.postSale);
router.get("/accounting/inventory-scan", acctCtrl.scanInventorySku);
router.get("/accounting/debtors", acctCtrl.listDebtors);
router.get("/accounting/customers/:customerUserId/statement", acctCtrl.getCustomerStatement);
router.post("/accounting/customers/:customerUserId/payments", acctCtrl.postCustomerPayment);
router.post("/accounting/customers/:customerUserId/charges", acctCtrl.postCustomerCharge);
router.get("/accounting/till/sessions", acctCtrl.listTillSessions);
router.post("/accounting/till/open", acctCtrl.postTillOpen);
router.post("/accounting/till/:id/close", acctCtrl.postTillClose);

router.get("/insights/simple", reportDashCtrl.getSimpleReporting);
router.get("/insights/periodical", reportDashCtrl.getPeriodical);
router.get("/insights/distancing", reportDashCtrl.getDistancing);
router.get("/insights/busiest", reportDashCtrl.getBusiest);
router.get("/insights/bestsellers", reportDashCtrl.getBestsellers);
router.get("/insights/bonus-preview", reportDashCtrl.getBonusPreview);
router.get("/insights/advanced", reportDashCtrl.getAdvanced);

router.get("/staff-leaves", reportDashCtrl.listLeaves);
router.post("/staff-leaves", reportDashCtrl.createLeave);
router.patch("/staff-leaves/:id", reportDashCtrl.reviewLeave);

router.get("/facility/pets/:petId/weights", reportDashCtrl.listWeights);
router.post("/facility/pets/:petId/weights", reportDashCtrl.createWeight);

export default router;
