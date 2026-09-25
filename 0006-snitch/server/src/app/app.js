import express from "express"
import authRoutes from "../routes/auth.routes.js"
import cookieParser from "cookie-parser"
import productRoutes from "../routes/products.routes.js"
import cartRoutes from "../routes/cart.routes.js"


const app = express()

app.use(express.json())
app.use(cookieParser())


app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)

export default app