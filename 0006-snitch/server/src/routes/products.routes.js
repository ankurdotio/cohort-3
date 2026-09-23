import { Router } from "express"
import { createProductValidator } from "../validators/product.validator.js"
import { authenticate } from "../middlewares/auth.middleware.js"
import { createProduct } from "../controller/product.controller.js"

import multer from "multer"

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 5,
        fileSize: 1 * 1024 * 1024 // 1MB
    },
})



const router = Router()

/**
 * @method POST
 * @route /api/products/
 * @description creates the product and save its data into the DB, images will be store on imagekit.
 * @access seller
 * req.body=>{title,description:price:{amount,currency},sizes:[{size,stock},{si–ze,stock}]}
 */
router.post("/",
    // –––––––––––––– check is user authenticate ––––––––––––––––––––
    authenticate,
    // –––––––––––––– check the role is seller or not ––––––––––––––––––––
    (req, res, next) => {
        if (req.user.role !== "seller") {
            return res.status(403).json({
                message: "user is not authorize to create products"
            })
        }
        next()
    },
    // –––––––––––––– required for reading the data from req.body if the formate is form-data(multipart-form-data) ––––––––––––––––––––
    upload.array("images"),
    // –––––––––––––– parse the complex data like object and array into json ––––––––––––––––––––
    (req, res, next) => {
        req.body?.price && (req.body.price = JSON.parse(req.body.price))
        req.body?.sizes && (req.body.sizes = JSON.parse(req.body.sizes))
        next()
    },
    createProductValidator,
    createProduct)


export default router