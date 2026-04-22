import { Router } from "express";
import validate from "../middleware/validate.js";
import { filterFields, sortFields } from "../models/Client.js";
import buildQuery from "../middleware/buildQuery.js";
import * as clientSchema from "../validators/client.validator.js";
import * as clientController from "../controllers/client.controller.js";
import { checkIfClientInCompany, validateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", validate(clientSchema.schemaClientBody), validateUser, clientController.createClient);
router.put("/:id", validateUser, validate(clientSchema.schemaClientBody), checkIfClientInCompany, clientController.updateClient);
router.get("/", validate(clientSchema.schemaClientQuery), validateUser, buildQuery(filterFields, sortFields), clientController.getClients);
