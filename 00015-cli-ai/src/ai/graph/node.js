import { ChatGroq } from "@langchain/groq"
import { ToolMessage } from "langchain"
import { getApiKey } from "../../utils/file.utils.js"
import { AIMessage } from "langchain"
import { upsertFiles, readFiles, listFiles } from "../tools/files.tool.js"
import * as fileTools from "../tools/files.tool.js"
import rl from "../../utils/readline.js"





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

    const modelWithTool = model.bindTools([ upsertFiles, readFiles, listFiles ])

    const stream = await modelWithTool.stream(state.messages)



    let aiMessage = null
    for await (const chunk of stream) {
        process.stdout.write(chunk.text)
        if (!aiMessage) aiMessage = chunk
        else aiMessage = aiMessage.concat(chunk)
    }

    process.stdout.write("\n")

    return {
        messages: [
            ...state.messages,
            aiMessage
        ]
    }
}


/**
 * Handle the tool_calls from the AI
 * @param {Object} State - The state of the Graph
 * @returns {Promise<Object>} - The updated state after handling tool calls
 */
export async function ToolNode(state, config) {

    const messages = state.messages
    const lastMessage = state.messages[ state.messages.length - 1 ]
    const toolCalls = lastMessage.tool_calls

    const toolResults = []

    for (const toolCall of toolCalls) {

        switch (toolCall.name) {
            case "upsertFiles":
                process.stdout.write(`[Tool]: Updating/creating files ${JSON.stringify(toolCall.args.files.map(f => f.path).join(", "))}\n`)
                const userInput = await rl.question("Do you want to proceed? (yes/no): ")
                if (userInput.toLowerCase() !== "yes") {
                    process.stdout.write("Aborting file update.\n")
                    return new ToolMessage({
                        content: "User aborted file update/create.",
                        tool_call_id: toolCall.id
                    })
                }
                const result = await fileTools.upsertFiles.invoke(toolCall)
                toolResults.push(result)
                break;
            case "readFiles":
                process.stdout.write(`[Tool]: Reading files ${JSON.stringify(toolCall.args.files.map(f => f.path).join(", "))}\n`)
                const readResult = await fileTools.readFiles.invoke(toolCall)
                toolResults.push(readResult)
                break;

            case "listFiles":
                process.stdout.write(`[Tool]: Listing files\n`)
                const listResult = await fileTools.listFiles.invoke(toolCall)
                toolResults.push(listResult)
                break;

            default:
                process.stdout.write(`[Tool]: Unknown tool ${toolCall.name}\n`)
                break;
        }

    }


    return {
        messages: [
            ...state.messages,
            ...toolResults
        ]
    }

}