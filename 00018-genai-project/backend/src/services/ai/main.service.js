import { ChatGroq } from "@langchain/groq"
import { env } from '../../config/env.js';


const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: env.GROQ_API_KEY,
});


export default model;