import { body, param } from "express-validator";

/**
 * Validation chain for `POST /api/posts`.
 * @type {import("express-validator").ValidationChain[]}
 */
export const createPostValidator = [
  body("caption")
    .isString().withMessage("Caption is required")
    .trim()
    .notEmpty().withMessage("Caption is required")
    .isLength({ max: 2200 }).withMessage("Caption must be at most 2200 characters"),
];

/**
 * Validation chain for routes with a `:postId` parameter.
 * @type {import("express-validator").ValidationChain[]}
 */
export const postIdValidator = [
  param("postId").isMongoId().withMessage("Invalid post id"),
];

/**
 * Validation chain for `PATCH /api/posts/:postId/update`.
 * @type {import("express-validator").ValidationChain[]}
 */
export const updatePostValidator = [...postIdValidator, ...createPostValidator];
