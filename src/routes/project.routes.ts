import { Router } from "express";
import validate from "../middleware/validate.js";
import { buildQueryProject } from "../middleware/buildQuery.js";
import * as commonSchema from "../validators/common.validator.js";
import * as projectSchema from "../validators/project.validator.js";
import * as projectController from "../controllers/project.controller.js";
import { checkIfProjectInCompany, checkIfUserHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

router.post("/", validate(projectSchema.schemaProjectBody), validateUser, checkIfUserHasCompany, projectController.createProject);
router.get("/", validate(projectSchema.schemaProjectQuery), validateUser, checkIfUserHasCompany, buildQueryProject, projectController.getProjects);
router.get("/archived", validateUser, authorizeRoles("admin"), checkIfUserHasCompany, projectController.getArchivedProjects);
router.get("/:id", validateUser, checkIfUserHasCompany, checkIfProjectInCompany, projectController.getProject);
router.put("/:id", validate(projectSchema.schemaProjectBody), validateUser, checkIfUserHasCompany, checkIfProjectInCompany, projectController.updateProject);
router.delete("/:id", validate(commonSchema.schemaSoftDelete), validateUser, checkIfUserHasCompany, checkIfProjectInCompany, projectController.deleteProject);
router.patch("/:id/restore", validateUser, authorizeRoles("admin"), checkIfUserHasCompany, checkIfProjectInCompany, projectController.restoreProject);

export default router;