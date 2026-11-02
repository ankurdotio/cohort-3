import { ChatGroq } from "@langchain/groq"
import { getApiKey } from "../utils/file.utils.js"
import { AIMessage } from "langchain"


/**
 * Handles the LLM node logic for the state graph.
 * @param {Object} state - The current state of the graph.
 * @returns {Promise<Object>} - The updated state after processing.
 */
export async function LLMNode(state, config) {

    const model = new ChatGroq({
        model: "openai/gpt-oss-120b",
        apiKey: (await getApiKey()).apiKey,
    })

    const stream = await model.stream(state.messages)

    process.stdout.write("[AI]: ")

    let aiMessage = ""
    for await (const chunk of stream) {
        process.stdout.write(chunk.text)
        aiMessage += chunk.text
    }

    process.stdout.write("\n")

    return {
        messages: [
            ...state.messages,
            new AIMessage(aiMessage)
        ]
    }
}