/**
 * Post domain types. Import with JSDoc: `@typedef {import("../types/post.js").Post} Post`.
 */

/**
 * @typedef {Object} Post
 * @property {import("mongoose").Types.ObjectId} _id
 * @property {import("mongoose").Types.ObjectId} user
 * @property {string} caption
 * @property {number} likes
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} PostAuthor
 * @property {import("mongoose").Types.ObjectId} _id
 * @property {string} name
 */

/**
 * @typedef {Omit<Post, "user"> & { user: PostAuthor | null }} PostWithAuthor
 */

/**
 * @typedef {Object} CreatePostInput
 * @property {string} user - Author's user id.
 * @property {string} caption
 */

/**
 * @typedef {Object} PublicPost
 * @property {string} id
 * @property {{ id: string, name: string } | null} user
 * @property {string} caption
 * @property {number} likes
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

export {};
