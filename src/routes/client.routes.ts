import { Router } from "express";
import validate from "../middleware/validate.js";
import { buildQueryClient } from "../middleware/buildQuery.js";
import * as commonSchema from "../validators/common.validator.js";
import * as clientSchema from "../validators/client.validator.js";
import * as clientController from "../controllers/client.controller.js";
import { clientInCompany, userHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

router.post("/", validate(clientSchema.schemaClientBody), validateUser, userHasCompany, clientController.createClient);
router.get("/", validate(clientSchema.schemaClientQuery), validateUser, userHasCompany, buildQueryClient, clientController.getClients);
router.get("/archived", validateUser, authorizeRoles("admin"), userHasCompany, clientController.getArchivedClients);
router.get("/:id", validateUser, userHasCompany, clientInCompany, clientController.getClient);
router.put("/:id", validate(clientSchema.schemaClientBody), validateUser, userHasCompany, clientInCompany, clientController.updateClient);
router.delete("/:id", validate(commonSchema.schemaSoftDelete), validateUser, userHasCompany, clientInCompany, clientController.deleteClient);
router.patch("/:id/restore", validateUser, authorizeRoles("admin"), userHasCompany, clientController.restoreClient);

export default router;