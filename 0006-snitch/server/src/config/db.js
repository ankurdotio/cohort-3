import mongoose from "mongoose"
import config from "./config.js"


export async function connectToDB() {

    await mongoose.connect(config.MONGO_URI)

    console.log("Connected to database")

}