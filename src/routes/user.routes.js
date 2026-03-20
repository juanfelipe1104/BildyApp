import { Router } from "express";
import { validateUser } from "../middleware/auth.midddleware.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.get('/', validateUser, userController.getUser);

export default router;