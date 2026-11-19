import { ConversationModel } from '../models/conversation.model.js';

/**
 * @param {{user: string | import('mongoose').Types.ObjectId, title?: string}} input Conversation owner and title.
 * @returns {Promise<import('../types/conversation.js').Conversation>} Persisted conversation.
 */
export async function createConversation(input) {
  return ConversationModel.create(input);
}

/**
 * @param {string | import('mongoose').Types.ObjectId} id Conversation identifier.
 * @param {string | import('mongoose').Types.ObjectId} userId Owner identifier.
 * @returns {Promise<import('../types/conversation.js').Conversation | null>} Owned conversation or null.
 */
export async function findConversationByIdAndUser(id, userId) {
  return ConversationModel.findOne({ _id: id, user: userId });
}
