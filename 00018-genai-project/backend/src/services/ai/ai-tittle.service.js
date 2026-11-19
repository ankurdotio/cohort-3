import { ChatGroq } from "@langchain/groq"
import { env } from "../../config/env.js";
import { SystemMessage, HumanMessage } from "langchain"
import * as z from "zod";



const model = new ChatGroq({
    model: "qwen/qwen3.8-27b",
    apiKey: env.GROQ_API_KEY
})


const structureModel = model.withStructuredOutput(z.object({
    title: z.string().min(1).max(60).describe("The title of the conversation on the basis of the user's message")
}))


/**
 * @function generateTitle
 * @param {string} message - The user's message to generate a title for
 * @returns {Promise<{ title: string }>} The generated title
 */
export async function generateTitle(message) {

    const systemMessage = new SystemMessage(`
        You are an AI assistant that generates a concise and relevant title for a conversation based on the user's message.

        ## Follow these guidelines:
        - The title should be concise and relevant to the user's message.
        - The title should be no longer than 60 characters.
        - Avoid using generic titles like "Chat" or "Conversation".
        - Focus on the main topic or intent of the user's message.
        
        `)

    const humanMessage = new HumanMessage(message)

    const response = await structureModel.invoke([ systemMessage, humanMessage ])

    return response

}