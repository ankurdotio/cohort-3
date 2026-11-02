import { getSettingsFile, saveApiKey, getApiKey } from "./utils/file.utils.js"
import rl from "./utils/readline.js"
import initGraph from "./ai/graph/graph.js"

async function main() {
    const settings = await getSettingsFile()

    if (!settings.apiKey) {
        const apiKey = await rl.question("Please enter your API key: ")
        await saveApiKey(apiKey)
    }

    const response = await getApiKey()

    if (response.error) {
        console.error("Invalid OR Expired API key")

        const apiKey = await rl.question("Please enter your API key: ")
        await saveApiKey(apiKey)
        return main()
    }

    await initGraph()

    rl.close()
}


export default main