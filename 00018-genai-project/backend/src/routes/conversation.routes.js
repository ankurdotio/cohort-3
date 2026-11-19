import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sendMessageValidator } from '../validators/conversation.validator.js';
import { handleMessage } from '../controller/conversation.controller.js';

const router = Router();

// Define your conversation routes here

/**
 * @POST 
 * @route /api/v1/conversation
 * @desc handle the user message
 * req.body should contain the user message and conversation ID (conversationId is optional)
 */
router.post("/", requireAuth, sendMessageValidator, validate, handleMessage)

export default router;