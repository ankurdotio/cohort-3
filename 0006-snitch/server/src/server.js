import app from "./app/app.js"
import { connectToDB } from "./config/db.js"

await connectToDB()

app.listen(3000, () => {
    console.log("Server is Running on port 3000")
})