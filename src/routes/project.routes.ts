import { Router } from "express";
import validate from "../middleware/validate.js";
import { buildQueryProject } from "../middleware/buildQuery.js";
import * as commonSchema from "../validators/common.validator.js";
import * as projectSchema from "../validators/project.validator.js";
import * as projectController from "../controllers/project.controller.js";
import { projectInCompany, userHasCompany, validateUser } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = Router();

router.post("/", validate(projectSchema.schemaProjectBody), validateUser, userHasCompany, projectController.createProject);
router.get("/", validate(projectSchema.schemaProjectQuery), validateUser, userHasCompany, buildQueryProject, projectController.getProjects);
router.get("/archived", validateUser, authorizeRoles("admin"), userHasCompany, projectController.getArchivedProjects);
router.get("/:id", validate(commonSchema.schemaObjectId), validateUser, userHasCompany, projectInCompany, projectController.getProject);
router.put("/:id", validate(commonSchema.schemaObjectId), validate(projectSchema.schemaProjectUpdateBody), validateUser, userHasCompany, projectInCompany, projectController.updateProject);
router.delete("/:id", validate(commonSchema.schemaObjectId), validate(commonSchema.schemaSoftDelete), validateUser, userHasCompany, projectInCompany, projectController.deleteProject);
router.patch("/:id/restore", validate(commonSchema.schemaObjectId), validateUser, authorizeRoles("admin"), userHasCompany, projectController.restoreProject);

export default router;