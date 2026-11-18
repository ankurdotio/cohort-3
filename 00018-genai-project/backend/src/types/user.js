/**
 * @typedef {import('mongoose').InferSchemaType<typeof import('../models/user.model.js').userSchema> & {_id: import('mongoose').Types.ObjectId}} User
 * @typedef {{name: string, email: string, password: string}} RegisterInput
 * @typedef {{email: string, password: string}} LoginInput
 * @typedef {{id: string, name: string, email: string, createdAt: Date}} PublicUser
 * @typedef {{accessToken: string, refreshToken: string}} TokenPair
 */
export {};
