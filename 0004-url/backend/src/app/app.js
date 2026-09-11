import express from "express"
import urlRoutes from "../routes/url.routes.js"
import urlModel from "../models/url.model.js"


const app = express()

app.use(express.json())

app.use("/api/url", urlRoutes)

app.get("/:code", async function (req, res) {

    const { code } = req.params

    const url = await urlModel.findOne({
        shortCode: code
    })

    if (!url) {
        return res.status(404).json({ error: "URL not found" })
    }

    res.redirect(302, url.originalUrl)

    await urlModel.findOneAndUpdate({
        shortCode: code
    }, {
        $inc: { clicks: 1 }
    })
})




export default app