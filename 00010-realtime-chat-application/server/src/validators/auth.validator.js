import { body } from 'express-validator';

/** Registration field validation; passwords are limited by bcrypt's byte limit. */
export const registerValidator = [
  body('name')
    .isString()
    .withMessage('Enter your name')
    .bail()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .isString()
    .bail()
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Enter a password')
    .bail()
    .isLength({ min: 8 })
    .withMessage('Password must contain at least 8 characters')
    .matches(/[a-z]/i)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must not exceed 72 bytes'),
];

/** Generic login validation avoids disclosing which credential was invalid. */
export const loginValidator = [
  body('email')
    .isString()
    .withMessage('Invalid credentials')
    .bail()
    .trim()
    .isEmail()
    .withMessage('Invalid credentials')
    .normalizeEmail(),
  body('password')
    .isString()
    .withMessage('Invalid credentials')
    .bail()
    .notEmpty()
    .withMessage('Invalid credentials'),
];
