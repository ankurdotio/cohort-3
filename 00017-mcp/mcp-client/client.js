import { MCPAdapter } from "@langchain/mcp-adapters";
import { createAgent } from "langchain"


const adapter = new MCPAdapter({
    servers: {
        // Local server: adapter spawns it as a child process (stdio)
        calendar: {
            command: "node",
            args: [ "../mcp-server/server.js" ],
        },
        // Remote server: Streamable HTTP is the default for a url
        docs: {
            url: "https://docs.langchain.com/mcp",
        },
    },
});


const tools = await adapter.listTools();

console.log("Available tools:", tools);



