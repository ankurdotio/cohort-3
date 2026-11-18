import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';




/**
 * @POST 
 * @route /api/v1/conversation
 * @desc handle the user message
 * req.body should contain the user message and conversation ID (conversationId is optional)
 */
export async function handleMessage(req, res) {

    const { content, conversation } = req.body;

    if(!conversation){
        /**
         * create new conversation
         */
    }

}