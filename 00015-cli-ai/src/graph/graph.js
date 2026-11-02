import { StateGraph, START, END } from "@langchain/langgraph"
import { LLMNode } from "./node.js"
import { HumanMessage } from "langchain"
import rl from "../utils/readline.js"
import * as z from "zod"


const stateFormate = z.object({
    messages: z.array(z.any())
})


const graph = new StateGraph(stateFormate)
    .addNode("LLMNode", LLMNode)
    .addEdge(START, "LLMNode")
    .addEdge("LLMNode", END)
    .compile()


export default async function initGraph() {

    while (true) {


        const userInput = await rl.question("[User]: ")

        const response = await graph.invoke({
            messages: [
                new HumanMessage(userInput)
            ]
        })

        console.log("[AI]:", response)
    }

}