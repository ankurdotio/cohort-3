import mongoose from "mongoose"
import config from "./config.js"


console.log(config)

async function connectToDB() {

    await mongoose.connect(config.MONGO_URI)
    console.log("Server Connected to DB")
}


export default connectToDB