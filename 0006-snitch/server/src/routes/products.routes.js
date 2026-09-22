import { Router } from "express"
import { createProductValidator } from "../validators/product.validator.js"

const router = Router()

/**
 * @method POST
 * @route /api/products/
 * @description creates the product and save its data into the DB, images will be store on imagekit.
 * @access seller
 * req.body=>{title,description:price:{amount,currency},sizes:[{size,stock},{si–ze,stock}]}
 */


export default router