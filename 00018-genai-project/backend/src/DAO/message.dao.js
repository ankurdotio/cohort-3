import { MessageModel } from '../models/message.model.js';

/**
 * @param {{role: import('../types/conversation.js').MessageRole, content: string, conversation: string | import('mongoose').Types.ObjectId}} input Message data.
 * @returns {Promise<import('../types/conversation.js').Message>} Persisted message.
 */
export async function createMessage(input) {
  return MessageModel.create(input);
}

/**
 * The caller must verify ownership of the conversation before loading its messages.
 * @param {string | import('mongoose').Types.ObjectId} conversationId Conversation identifier.
 * @returns {Promise<import('../types/conversation.js').Message[]>} Messages in chronological order.
 */
export async function findMessagesByConversation(conversationId) {
  return MessageModel.find({ conversation: conversationId });
}
