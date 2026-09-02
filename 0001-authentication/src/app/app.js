import express from "express";
import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js";
import { authenticate } from "../middleware/auth.middleware.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();

const app = express();

app.use(express.json())

app.get("/api", (req, res) => {
    res.status(200).json({
        message: "Welcome to the authentication API"
    })
})


app.post("/api/auth/register", async (req, res) => {

    const { email, name, password } = req.body

    const user = await userModel.create({
        email, name, password: await bcrypt.hash(password, 10)
    })

    const token = jwt.sign(
        {
            id: user._id
        },
        process.env.JWT_SECRET
    )

    res.status(201).json({
        message: "User Create Successfully",
        data: {
            user: {
                email,
                name,
                id: user._id
            },
            token
        }
    })


})


app.get("/api/auth/me", authenticate, async (req, res) => {

    console.log(req.user)

    res.status(200).json({
        data: {
            user: req.user
        }
    })

})


app.post("/api/auth/login", async (req, res) => {


    /**
     * password = Test123#
     */
    const { email, password } = req.body

    const user = await userModel.findOne({
        email
    })

    const isValidPassword = bcrypt.compare(password, user.password)

    if (!isValidPassword) {
        return res.status(400).json({
            message: "Invalid Email or Password"
        })
    }

    const token = jwt.sign({
        id: user._id
    }, process.env.JWT_SECRET)

    res.status(200).json({
        message: "user loggedIn successfully",
        data: {
            user: {
                email: user.email,
                name: user.name
            }
        },
        token
    })

})


export default app;