import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { createAccessToken, createRefreshToken } from "../utils/auth.utils.js"


/**
 * @description Register an user and save the data from req.body
* @param req express.Request
* @param req.body Object
* @param req.body.email String
* @param req.body.name String
* @param req.body.password String
 */
export async function register(req, res) {

    const { email, name, password } = req.body

    const isUserAlreadyExists = await userModel.findOne({
        email
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "User already exists with this email address",
            errors: [
                {
                    field: "email",
                    message: "User already exists with this email address"
                }
            ]
        })
    }

    const user = await userModel.create({
        email,
        name,
        passwordHash: await bcrypt.hash(password, 12)
    })

    const accessToken = createAccessToken({
        userId: user._id,
        role: user.role
    })
    const refreshToken = createRefreshToken({
        userId: user._id,
        role: user.role
    })

}