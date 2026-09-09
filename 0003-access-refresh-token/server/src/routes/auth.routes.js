import { Router } from "express";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokens, verifyAccessToken, verifyRefreshToken } from "../utils/auth.js";

const router = Router();


/**
 * @POST /api/auth/register
 */
router.post("/register", async (req, res) => {

    const { name, email, password } = req.body

    const isUserExists = await userModel.findOne({ email })

    if (isUserExists) {
        return res.status(400).json({
            message: "User already exists",
            errors: [
                {
                    path: "email",
                    message: "User already exists"
                }
            ]
        })
    }

    const user = await userModel.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12)
    })

    const { accessToken, refreshToken } = generateTokens({ userId: user._id })


    user.refreshToken = refreshToken
    await user.save()

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
    })

    res.status(201).json({
        message: "user registered successfully",
        data: {
            user: {
                name: user.name,
                email: user.email
            }
        },
        accessToken
    })

})


/**
 * @GET /api/auth/me
 */
router.get("/me", async (req, res) => {

    const accessToken = req.headers.authorization?.split(" ")[ 1 ]

    if (!accessToken) {
        return res.status(401).json({
            message: "Unauthorized, access token not found",
        })
    }

    try {

        const decoded = verifyAccessToken(accessToken)

        const user = await userModel.findById(decoded.id)

        res.status(200).json({
            message: "user fetched successfully",
            data: {
                user: {
                    name: user.name,
                    email: user.email
                }
            }
        })

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized, Invalid or expired access token",
        })
    }


})


/**
 * @POST /api/auth/refresh
 */
router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
        return res.status(401).json({
            message: "Unauthorized, refresh token not found",
        })
    }

    try {

        const decoded =  verifyRefreshToken(refreshToken)

        const user = await userModel.findById(decoded.id)

        if (refreshToken !== user.refreshToken) {

            user.refreshToken = null
            await user.save()

            return res.status(401).json({
                message: "Unauthorized, refresh token mismatch",
            })
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens({ userId: user._id })

        res.cookie("refreshToken", newRefreshToken, { httpOnly: true })

        user.refreshToken = newRefreshToken
        await user.save()

        res.status(200).json({
            message: "Tokens refreshed successfully",
            accessToken
        })
    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized, Invalid or expired refresh token",
        })
    }
})


export default router;