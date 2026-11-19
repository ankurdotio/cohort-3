import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateTitle } from '../services/ai/ai-tittle.service.js';
import { createConversation, findConversationByIdAndUser } from '../DAO/conversation.dao.js';
import { findMessagesByConversation, createMessage } from '../DAO/message.dao.js';
import model from "../services/ai/main.service.js";
import { HumanMessage, AIMessage } from 'langchain';




/**
 * @POST 
 * @route /api/v1/conversation
 * @desc handle the user message
 * req.body should contain the user message and conversation ID (conversationId is optional)
 */
export async function handleMessage(req, res, next) {

    const { content, conversation: conversationId } = req.body;
    const user = req.user;

    let conversation = null

    if (!conversationId) {

        const { title } = await generateTitle(content);

        conversation = await createConversation({ user: user.id, title });

    } else {
        conversation = await findConversationByIdAndUser(conversationId, user.id);
        if (!conversation) {
            return next(new AppError(404, 'Conversation not found'));
        }
    }


    const messages = (await findMessagesByConversation(conversation.id))
        .map(msg => {
            if (msg.role === "user") {
                return new HumanMessage(msg.content);
            } else if (msg.role === "assistant") {
                return new AIMessage(msg.content);
            }
            return null;
        }).filter(Boolean)

    messages.push(new HumanMessage(content));

    await createMessage({
        role: "user",
        content: content,
        conversation: conversation._id
    })

    const stream = await model.stream(messages);


    // ––––––––––––––––––––– set headers for SSE ––––––––––––––––––––––
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // ––––––––––––––––––––– send conversation details via SSE –––––––––––––––––––––
    res.write(`data: ${JSON.stringify({
        conversationId: conversation.id,
        title: conversation.title
    })}\n\n`);

    let aiChunk = null;
    for await (const chunk of stream) {
        if (aiChunk == null) {
            aiChunk = chunk;
        } else {
            aiChunk = aiChunk.concat(chunk);
        }

        res.write(`data: ${JSON.stringify({ chunk: chunk.content })}\n\n`);
    }

    // ––––––––––––––––––––– end of SSE –––––––––––––––––––––
    res.end();

    await createMessage({
        role: "assistant",
        content: aiChunk.content,
        conversation: conversation._id
    });

}