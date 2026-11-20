import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sendMessageValidator } from '../validators/conversation.validator.js';
import { handleMessage, getAllConversations, getMessagesByConversation } from '../controller/conversation.controller.js';

const router = Router();

// Define your conversation routes here

/**
 * @POST 
 * @route /api/v1/conversation
 * @desc handle the user message
 * req.body should contain the user message and conversation ID (conversationId is optional)
 */
router.post("/", requireAuth, sendMessageValidator, validate, handleMessage)


/**
 * @GET
 * @route /api/v1/conversation/
 * @desc get all the conversation of the user
 */
router.get("/", requireAuth, getAllConversations);

/**
 * @GET
 * @route /api/v1/conversation/messages/:conversationId
 * @desc get all messages of a specific conversation
 */
router.get("/messages/:conversationId", requireAuth, getMessagesByConversation);

export default router;