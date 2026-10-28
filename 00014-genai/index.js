import { ChatGroq } from "@langchain/groq"
import dotenv from "dotenv"
import rl from "readline/promises"

dotenv.config()

const readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout
})


const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
})




while (true) {
    const userInput = await readline.question("Enter your input: ")

    const stream = await model.stream([
        {
            role: "user",
            content: userInput
        }
    ])

    for await (const chunk of stream) {
        process.stdout.write(chunk.content)
    }

    process.stdout.write("\n")
}