import express from "express"
import morgan from "morgan"
import authRoutes from "../routes/auth.routes.js"
import passport from "../config/passport.js"

const app = express()

app.use(morgan("dev"))
app.use(express.json())
app.use(passport.initialize())

app.use("/api/auth", authRoutes)

export default app;