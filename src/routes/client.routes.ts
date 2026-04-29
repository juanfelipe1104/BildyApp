import { Router } from "express";
import validate from "../middleware/validate.js";
import { buildQueryClient } from "../middleware/buildQuery.js";
import * as commonSchema from "../validators/common.validator.js";
import * as clientSchema from "../validators/client.validator.js";
import * as clientController from "../controllers/client.controller.js";
import { checkIfClientInCompany, checkIfUserHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

router.post("/", validate(clientSchema.schemaClientBody), validateUser, checkIfUserHasCompany, clientController.createClient);
router.get("/", validate(clientSchema.schemaClientQuery), validateUser, checkIfUserHasCompany, buildQueryClient, clientController.getClients);
router.get("/archived", validateUser, authorizeRoles("admin"), checkIfUserHasCompany, clientController.getArchivedClients);
router.get("/:id", validateUser, checkIfUserHasCompany, checkIfClientInCompany, clientController.getClient);
router.put("/:id", validate(clientSchema.schemaClientBody), validateUser, checkIfUserHasCompany, checkIfClientInCompany, clientController.updateClient);
router.delete("/:id", validate(commonSchema.schemaSoftDelete), validateUser, checkIfUserHasCompany, checkIfClientInCompany, clientController.deleteClient);
router.patch("/:id/restore", validateUser, authorizeRoles("admin"), checkIfUserHasCompany, clientController.restoreClient);

export default router;