import { ChatGroq } from "@langchain/groq"
import { env } from '../../config/env.js';
import { ChatCohere } from "@langchain/cohere"
import { ChatOpenAI } from "@langchain/openai"
import { CohereClientV2 } from "cohere-ai"


const cohereClient = new CohereClientV2({
    token: env.COHERE_API_KEY
})

const model = new ChatCohere({
    model: "command-a-05-2026",
    client: cohereClient
});


export default model;