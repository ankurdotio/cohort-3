import { Router } from "express"
import { registerValidator } from "../validators/auth.validator.js"
import { register } from "../controller/auth.controller.js"



const router = Router()


/**
 * @POST /api/auth/register
 * @param req Express req
 * @param req.body = { email,name,password }
 * @response res.status = 201 (if successful)
 */
router.post("/register", registerValidator, register)


export default router