import { Router } from "express";
import { login, logout, me, refresh, register } from "../controller/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";

/** Auth routes mounted at `/api/v1/auth`. */
const router = Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
