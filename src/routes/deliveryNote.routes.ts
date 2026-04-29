import { Router } from "express";
import validate from "../middleware/validate.js";
import * as commonSchema from "../validators/common.validator.js";
import * as deliveryNoteSchema from "../validators/deliveryNote.validator.js";
import * as deliveryNoteController from "../controllers/deliveryNote.controller.js";
import { checkIfDeliveryNoteInCompany, checkIfUserHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { buildQueryDeliveryNote } from "../middleware/buildQuery.js";

const router = Router();

router.post("/", validate(deliveryNoteSchema.schemaDeliveryNoteBody), validateUser, checkIfUserHasCompany, deliveryNoteController.createDeliveryNote);
router.get("/", validate(deliveryNoteSchema.schemaDeliveryNoteQuery), validateUser, checkIfUserHasCompany, buildQueryDeliveryNote, deliveryNoteController.getDeliveryNotes);
router.get("/:id", validateUser, checkIfUserHasCompany, checkIfDeliveryNoteInCompany, deliveryNoteController.getDeliveryNote);
export default router;