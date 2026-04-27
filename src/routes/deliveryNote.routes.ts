import { Router } from "express";
import validate from "../middleware/validate.js";
import * as commonSchema from "../validators/common.validator.js";
import * as deliveryNoteSchema from "../validators/deliveryNote.validator.js";
import * as deliveryNoteController from "../controllers/deliveryNote.controller.js";
import { checkIfUserHasCompany, validateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", validate(deliveryNoteSchema.schemaDeliveryNoteBody), validateUser, checkIfUserHasCompany, deliveryNoteController.createDeliveryNote);

export default router;