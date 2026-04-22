import { Router } from "express";
import validate from "../middleware/validate.js";
import { filterFields, sortFields } from "../models/Client.js";
import buildQuery from "../middleware/buildQuery.js";
import * as commonSchema from "../validators/common.validator.js";
import * as clientSchema from "../validators/client.validator.js";
import * as clientController from "../controllers/client.controller.js";
import { checkIfClientInCompany, checkIfUserHasCompany, validateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", validate(clientSchema.schemaClientBody), validateUser, checkIfUserHasCompany, clientController.createClient);
router.put("/:id", validate(clientSchema.schemaClientBody), validateUser, checkIfUserHasCompany, checkIfClientInCompany, clientController.updateClient);
router.get("/", validate(clientSchema.schemaClientQuery), validateUser, checkIfUserHasCompany, buildQuery(filterFields, sortFields), clientController.getClients);
router.get("/:id", validateUser, checkIfUserHasCompany, checkIfClientInCompany, clientController.getClient);
router.delete("/:id", validate(commonSchema.schemaSoftDelete), validateUser, checkIfUserHasCompany, checkIfClientInCompany, clientController.deleteClient);
router.get("/archived", validateUser, checkIfUserHasCompany, clientController.getArchivedClients);
router.patch("/:id/restore", validateUser, checkIfUserHasCompany, clientController.restoreClient);