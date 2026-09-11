import mongoose from "mongoose"
import config from "./config.js"


export async function connectDB() {

    await mongoose.connect(config.MONGO_URI)
    console.log("Database connected successfully")

}