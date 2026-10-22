import { body } from "express-validator";

/**
 * Validation chain for `POST /auth/register`.
 * @type {import("express-validator").ValidationChain[]}
 */
export const registerValidator = [
  body("name")
    .isString().withMessage("Name is required")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
  body("email")
    .isString().withMessage("Email is required")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isString().withMessage("Password is required")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain a letter")
    .matches(/\d/).withMessage("Password must contain a number"),
];

/**
 * Validation chain for `POST /auth/login`. Messages are generic to avoid disclosing which field failed.
 * @type {import("express-validator").ValidationChain[]}
 */
export const loginValidator = [
  body("email")
    .isString().withMessage("Invalid credentials")
    .trim()
    .isEmail().withMessage("Invalid credentials")
    .normalizeEmail(),
  body("password")
    .isString().withMessage("Invalid credentials")
    .notEmpty().withMessage("Invalid credentials"),
];
