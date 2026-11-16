import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio"
import * as z from "zod"


const EVENTS = []


// ── MCP server ───────────────────────────────────────────────
const server = new McpServer({ name: "calendar-server", version: "1.0.0" });



server.registerTool(
    "create_event",
    {
        description: "Create a new calendar event",
        inputSchema: z.object({
            title: z.string().describe("Title of the event"),
            start: z.string().describe("Start time of the event"),
            end: z.string().describe("End time of the event")
        })
    },
    async ({ title, start, end }) => {

        const event = { title, start, end };
        EVENTS.push(event);
        return {
            content: [
                {
                    type: "text",
                    text: `Event created: ${title} from ${start} to ${end}`
                }
            ]
        }
    }
)


const transport = new StdioServerTransport();
await server.connect(transport);