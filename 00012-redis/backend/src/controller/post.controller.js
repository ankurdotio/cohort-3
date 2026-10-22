import { createPost, findPostByIdWithAuthor, updatePostCaption } from "../DAO/post.dao.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Redis } from "ioredis"





const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.once("connect", () => {
  console.log("Connected to Redis");
});


/**
 * @typedef {import("../types/post.js").Post} Post
 * @typedef {import("../types/post.js").PostWithAuthor} PostWithAuthor
 * @typedef {import("../types/post.js").PublicPost} PublicPost
 */

/**
 * Maps a post to its client-safe representation.
 * @param {PostWithAuthor} post - Post with populated author.
 * @returns {PublicPost} Public post.
 */
const toPublicPost = (post) => ({
  id: post._id.toString(),
  user: post.user ? { id: post.user._id.toString(), name: post.user.name } : null,
  caption: post.caption,
  likes: post.likes,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

/**
 * POST /api/posts — creates a post authored by the authenticated user.
 * @param {import("express").Request} req - Body: `{ caption }`; `req.user` set by `requireAuth`.
 * @param {import("express").Response} res - 201 with `{ post }`.
 * @returns {Promise<void>}
 * @throws {AppError} 401 when unauthenticated.
 */
export const createPostHandler = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");

  const post = await createPost({ user: req.user._id.toString(), caption: req.body.caption });
  const author = { _id: req.user._id, name: req.user.name };

  sendSuccess(res, 201, "Post created", { post: toPublicPost({ ...post, user: author }) });
});

/**
 * GET /api/posts/:postId/details — returns a post with its author.
 * @param {import("express").Request} req - Params: `{ postId }`.
 * @param {import("express").Response} res - 200 with `{ post }`.
 * @returns {Promise<void>}
 * @throws {AppError} 404 when the post does not exist.
 */
export const getPostDetails = asyncHandler(async (req, res) => {

  const cachedPost = await redis.get(`post:${req.params.postId}`);

  if (cachedPost) {
    return sendSuccess(res, 200, "Post details", { post: JSON.parse(cachedPost) });
  }

  const post = await findPostByIdWithAuthor(String(req.params.postId));
  if (!post) throw new AppError(404, "Post not found");

  await redis.set(`post:${req.params.postId}`, JSON.stringify(toPublicPost(post)));

  sendSuccess(res, 200, "Post details", { post: toPublicPost(post) });
});

/**
 * PATCH /api/posts/:postId/update — updates a post's caption and invalidates its cached details.
 * @param {import("express").Request} req - Params: `{ postId }`; body: `{ caption }`.
 * @param {import("express").Response} res - 200 with `{ post }`.
 * @returns {Promise<void>}
 * @throws {AppError} 404 when the post does not exist.
 */
export const updatePostHandler = asyncHandler(async (req, res) => {
  const postId = String(req.params.postId);

  const post = await updatePostCaption(postId, req.body.caption);
  if (!post) throw new AppError(404, "Post not found");

  await redis.del(`post:${postId}`);

  sendSuccess(res, 200, "Post updated", { post: toPublicPost(post) });
});
