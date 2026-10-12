import { config } from "dotenv"
config()



const _config = {
    MONGO_URI: process.env.MONGO_URI,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
}

export default Object.freeze(_config);