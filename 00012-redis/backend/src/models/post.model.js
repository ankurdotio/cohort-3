import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    caption: { type: String, required: true, trim: true, maxlength: 2200 },
    likes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

postSchema.index({ user: 1, createdAt: -1 });

export const PostModel = mongoose.model("Post", postSchema);
