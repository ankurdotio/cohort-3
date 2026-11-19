import mongoose from 'mongoose';

export const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
    default: 'New conversation'
  },
  lastMessage: { type: Date, default: null },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'lastUpdate' } });

// Supports listing a user's conversations, most recently active first.
conversationSchema.index({ user: 1, lastMessage: -1 });

export const ConversationModel = mongoose.model('Conversation', conversationSchema);





/**
 * Write an essay on INDIA ?
 * 
 * title = write an essay on INDIA about its history, culture, and significance.
 */