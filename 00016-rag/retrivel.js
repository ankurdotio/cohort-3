import { ChatCohere, CohereEmbeddings } from "@langchain/cohere"
import "dotenv/config"
import { Pinecone } from '@pinecone-database/pinecone';
import { HumanMessage, ToolMessage, AIMessage } from "langchain";


const userInput = "How was the Arav's first job experience ?"

// –––––––––––––––––––––––––––––– initialize Embedding Model ––––––––––––––––––––––––
const embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: "embed-v5.0-fast",
})


// –––––––––––––––––––––––––––––– create vector representation of user input ––––––––––––––––––––––––
const vector = await embeddings.embedQuery(userInput)


// –––––––––––––––––––––––––– Initialize Pinecone client –––––––––––––––––––––––––
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });


const index = pc.Index({
    name: "cohort-rag",
    host: "https://cohort-rag-xg6uzh1.svc.aped-4627-b74a.pinecone.io"
});


// –––––––––––––––––––––––––– query Pinecone index with vector –––––––––––––––––––––––––
const results = await index.documents.search({
    topK: 3,
    scoreBy: [
        {
            type: 'dense_vector',
            fields: [ 'embedding' ],
            values: vector,
        }
    ],
    includeFields: [ 'content' ]
})



// –––––––––––––––––––––––––––––– initialize Chat Model ––––––––––––––––––––––––
const model = new ChatCohere({
    model: "command-a-03-2025",
    apiKey: process.env.COHERE_API_KEY
})

const messages = []

messages.push(new HumanMessage(userInput))


messages.push(new ToolMessage({
    content: JSON.stringify(results)
}))

const aiResponse = await model.stream(messages)


for await (const chunk of aiResponse) {
    process.stdout.write(chunk.text)
}

