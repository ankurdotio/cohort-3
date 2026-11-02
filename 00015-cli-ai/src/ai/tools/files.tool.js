import { tool } from "langchain";
import * as z from "zod"
import fs from "fs/promises"


/**
 * Create/Update multiple files at once (create one if not existed)
 */
export const upsertFilesTool = tool(
    async function ({ files }) {
        await Promise.all(files.map(async file => {
            return await fs.writeFile(file.path, file.content)
        }))
        return "file created successfully"
    },
    {
        name: "upsertFiles",
        description: "Create/Update multiple files at once (create one if not existed)",
        schema: z.object({
            files: z.array(z.object({
                path: z.string().describe("absolute path of the file to be created/update"),
                content: z.string().describe("content of the file to be created/update")
            }))
        })
    }
)