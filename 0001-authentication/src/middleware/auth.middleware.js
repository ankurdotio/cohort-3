import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

export const authenticate = async (req, res, next) => {

    const token = req.headers.authorization

    if (!token) {
        return res.status(401).json({
            message: "Token not found"
        })
    }

    const data = jwt.verify(token, process.env.JWT_SECRET)


    const user = await userModel.findById(data.id)

    req.user = user

    next()
}