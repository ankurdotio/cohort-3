import config from "./config.js"
import mongoose from "mongoose"

export default async function () {

    await mongoose.connect(config.MONGO_URI)

    console.log("Connected to MongoDB")
}