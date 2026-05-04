import { Router } from "express";
import * as ctrl from "../controllers/appointment.controller.js";
import { appointmentWriteMiddleware, petsByOwnerListMiddleware } from "../middleware/appointmentBookingAuth.js";

const router = Router();
const writeGuard = appointmentWriteMiddleware;

router.get("/appointments", ctrl.listAppointments);
router.post("/appointments", writeGuard, ctrl.createAppointment);
router.patch("/appointments/:id", writeGuard, ctrl.patchAppointment);
router.post("/appointments/:id/cancel", writeGuard, ctrl.cancelAppointment);

router.post("/pets", writeGuard, ctrl.createPet);
router.get("/pets/by-owner/:ownerUserId", petsByOwnerListMiddleware, ctrl.listPetsByOwner);
router.get("/pets/:id", ctrl.getPet);

router.get("/holidays", ctrl.listHolidays);
router.post("/holidays", writeGuard, ctrl.createHoliday);

export default router;
