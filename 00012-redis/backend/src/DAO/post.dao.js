import { PostModel } from "../models/post.model.js";

/**
 * @typedef {import("../types/post.js").Post} Post
 * @typedef {import("../types/post.js").PostWithAuthor} PostWithAuthor
 * @typedef {import("../types/post.js").CreatePostInput} CreatePostInput
 */

/**
 * Creates and persists a new post.
 * @param {CreatePostInput} input - Author id and caption.
 * @returns {Promise<Post>} The created post as a plain object.
 */
export const createPost = async (input) => {
  const post = await PostModel.create(input);
  return /** @type {Post} */ (/** @type {unknown} */ (post.toObject()));
};

/**
 * Finds a post by id with its author's public fields populated.
 * @param {string} id - Post id.
 * @returns {Promise<PostWithAuthor | null>} The post or null.
 */
export const findPostByIdWithAuthor = async (id) => {
  const post = await PostModel.findById(id).populate("user", "name").lean();
  return /** @type {PostWithAuthor | null} */ (/** @type {unknown} */ (post));
};
