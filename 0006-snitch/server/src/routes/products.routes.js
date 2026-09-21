import { Router } from "express"

const router = Router()

/**
 * @method POST
 * @route /api/products/
 * @description creates the product and save its data into the DB, images will be store on imagekit.
 * req.body=>{title,description:price:{amount,currency},sizes:[{size,stock},{size,stock}]}
 */


export default router