import express from "express"
import morgan from "morgan"
import paymentRoutes from "../routes/payment.routes.js"
import path from "path"
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express()

app.use(express.json())
app.use(morgan("dev"))


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"))
})

app.use("/api/payments", paymentRoutes)

export default app;