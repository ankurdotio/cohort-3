import express from "express"
import rateLimit from "express-rate-limit"


const app = express()

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 1 minute
    limit: 5,
    message: { message: 'Too many login attempts. Try again in 1 minute.' },
})


app.get("/api/login", loginLimiter, (req, res) => {
    const { email, password } = req.body


    /**
     * userMode.findOne({
     * email:email,
     * })
     */
})


app.listen(3000, () => {
    console.log("Server is running on port 3000")
})



/**
 * min length 8
 * must contain at least one uppercase letter
 * must contain at least one lowercase letter
 * must contain at least one number
 * must contain at least one special character
 */