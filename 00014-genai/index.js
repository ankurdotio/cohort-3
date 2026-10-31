import { ChatGroq } from "@langchain/groq"
import dotenv from "dotenv"
import rl from "readline/promises"
import { tool, createAgent } from "langchain"
import * as z from "zod"
import { StateGraph, START, END } from "@langchain/langgraph"

dotenv.config()

const events = []

const createEventTool = tool(
    async function ({ date, title, description }) {

        console.log("Creating event:", { date, title, description })

        events.push({
            date,
            title,
            description
        })
        return "Event created"
    },
    {
        name: "createEvent",
        description: "Creates a new event with a date, title, and description",
        schema: z.object({
            date: z.string(),
            title: z.string(),
            description: z.string()
        })
    }
)

const getEventsTool = tool(
    async function ({ }) {
        console.log("Retrieving events:", events)
        return events
    },
    {
        name: "getEvents",
        description: "Retrieves all events",
        schema: z.object({})
    })

const readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout
})


const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
})


// –––––––––––––––– LLM Node –––––––––––––––– 
async function LLMNode(state) {
    console.log("LLMNode state:", state)

    return {
        messages: [
            ...state.messages,
            {
                role: "assistant",
                content: "Hello, user!"
            }
        ]
    }
}


const graph = new StateGraph(
    z.object({
        messages: z.array(z.any())
    }))
    .addNode("LLMNode", LLMNode)
    .addEdge(START, "LLMNode")
    .addEdge("LLMNode", END)
    .compile()



const graphResult = await graph.invoke({
    messages: [
        {
            role: "user",
            content: "Hello, world!"
        }
    ]
})

console.log("Graph result:", graphResult)
