import { Router } from "express";
import validate from "../middleware/validate.js";
import * as commonSchema from "../validators/common.validator.js";
import * as deliveryNoteSchema from "../validators/deliveryNote.validator.js";
import * as deliveryNoteController from "../controllers/deliveryNote.controller.js";
import { deliveryNoteInCompany, userHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { buildQueryDeliveryNote } from "../middleware/buildQuery.js";
import upload from "../middleware/upload.js";

const router = Router();

router.post("/", validate(deliveryNoteSchema.schemaDeliveryNoteBody), validateUser, userHasCompany, deliveryNoteController.createDeliveryNote);
router.get("/", validate(deliveryNoteSchema.schemaDeliveryNoteQuery), validateUser, userHasCompany, buildQueryDeliveryNote, deliveryNoteController.getDeliveryNotes);
router.get("/pdf/:id", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, deliveryNoteInCompany, deliveryNoteController.getPDF);
router.get("/:id", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, deliveryNoteInCompany, deliveryNoteController.getDeliveryNote);
router.patch("/:id/sign", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, deliveryNoteInCompany, upload.single("signature"), deliveryNoteController.signPDF);
router.delete("/:id", validate(commonSchema.schemaObjectId), validate(commonSchema.schemaSoftDelete), validateUser, userHasCompany, deliveryNoteInCompany, deliveryNoteController.deleteDeliveryNote);

export default router;