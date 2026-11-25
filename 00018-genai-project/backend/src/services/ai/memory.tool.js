import { upsertContext, getContextByUserId } from "../../DAO/context.dao.js";
import * as z from "zod";
import { tool } from "langchain"




/**
 * @tool getUserContext
 * @description Retrieves the context for a current user.
 */
export const getUserContext = tool(
    async (_state, config) => {
        const { userId } = config.configurable
        const context = await getContextByUserId(userId);
        return context.context
    },
    {
        name: "getUserContext",
        description: `Use this to get the current user context.`,
        schema: z.object({})
    }
)


/**
 * @tool setUserContext
 * @description upsert the context for a current user.
 */
export const setUserContext = tool(
    async ({ context }, config) => {
        const { userId } = config.configurable;
        const updatedContext = await upsertContext(context, userId);
        return updatedContext.context;
    },
    {
        name: "setUserContext",
        description: `
        Use this to create or update the current user context.
        use this tool:
        - When you know something new about the user that will last long for days/weeks/months/years.
        - When you want to persist user-specific information across sessions.
        `,
        schema: z.object({
            context: z.string()
        })
    }
)

