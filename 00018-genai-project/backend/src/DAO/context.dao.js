import Context from "../models/context.model.js";



/**
 * @function upsertContext
 * @param {String} context
 * @param {String} userId
 * @returns {Promise<Context>}
 */
export async function upsertContext(context, userId) {
    return Context.findOneAndUpdate(
        { user: userId },
        { context },
        { upsert: true, new: true }
    );
}


/**
 * @function getContextByUserId
 * @param {String} userId
 * @returns {Promise<Context>}
 */
export async function getContextByUserId(userId) {
    return await Context.findOne({ user: userId });
}