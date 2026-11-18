import { body } from 'express-validator';

/**
 * Rules for sending a message: `content` is a required non-blank string, and
 * `conversation` is an optional ObjectId of an existing conversation to continue.
 * Ownership of the conversation must still be checked by the controller.
 */
export const sendMessageValidator = [
  body('content')
    .exists()
    .withMessage('Message content is required').bail()
    .isString()
    .withMessage('Message content must be a string').bail()
    .custom((value) => value.trim().length > 0).withMessage('Message content cannot be empty'),
  body('conversation')
    .optional({ values: 'null' })
    .isMongoId().withMessage('Conversation must be a valid id'),
];
