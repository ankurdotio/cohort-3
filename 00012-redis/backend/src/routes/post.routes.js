import { Router } from "express";
import { createPostHandler, getPostDetails } from "../controller/post.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createPostValidator, postIdValidator } from "../validators/post.validator.js";

/** Post routes mounted at `/api/posts`. */
const router = Router();

router.post("/", requireAuth, createPostValidator, validate, createPostHandler);
router.get("/:postId/details", postIdValidator, validate, getPostDetails);

export default router;
