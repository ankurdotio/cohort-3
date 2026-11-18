import { body } from 'express-validator';

const normalizeOptions = { gmail_remove_dots: false, gmail_remove_subaddress: false };

/** Registration rules; the byte limit prevents bcrypt's silent 72-byte truncation. */
export const registerValidator = [
  body('name').isString().withMessage('Enter your name').bail().trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isString().withMessage('Enter a valid email address').bail().trim()
    .isEmail().withMessage('Enter a valid email address').bail()
    .normalizeEmail(normalizeOptions),
  body('password').isString().withMessage('Enter a password').bail()
    .isLength({ min: 8 }).withMessage('Use at least 8 characters')
    .matches(/[a-z]/i).withMessage('Include at least one letter')
    .matches(/\d/).withMessage('Include at least one number')
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must be at most 72 UTF-8 bytes'),
];

/** Login errors are intentionally collapsed by the login validation middleware. */
export const loginValidator = [
  body('email').isString().bail().trim().isEmail().bail().normalizeEmail(normalizeOptions),
  body('password').isString().bail().notEmpty()
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72),
];
