import mongoose from 'mongoose';

export const MESSAGE_ROLES = Object.freeze(['user', 'assistant', 'tool']);

export const messageSchema = new mongoose.Schema({
  role: { type: String, enum: MESSAGE_ROLES, required: true },
  content: { type: String, required: true },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

// Supports loading a conversation's messages in chronological order.
messageSchema.index({ conversation: 1, createdAt: 1 });

export const MessageModel = mongoose.model('Message', messageSchema);
