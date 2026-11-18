/**
 * @typedef {import('mongoose').InferSchemaType<typeof import('../models/conversation.model.js').conversationSchema> & {_id: import('mongoose').Types.ObjectId}} Conversation
 * @typedef {import('mongoose').InferSchemaType<typeof import('../models/message.model.js').messageSchema> & {_id: import('mongoose').Types.ObjectId}} Message
 * @typedef {'user' | 'assistant' | 'tool'} MessageRole
 */
export {};
