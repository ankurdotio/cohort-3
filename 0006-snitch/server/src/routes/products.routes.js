import { Router } from "express"
import { createProductValidator, unlistProductValidator, listProductValidator } from "../validators/product.validator.js"
import { authenticate, authenticateSeller } from "../middlewares/auth.middleware.js"
import { createProduct, listAllProducts, unlistProduct, listProduct, listAllProductsToSeller } from "../controller/product.controller.js"


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
    authenticateSeller,
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


/**
 * @method GET
 * @route /api/product
 * @description Read all the published products from the DB
 * @access user
 */
router.get("/", authenticate, listAllProducts)



/**
 * @method GET
 * @route /api/product/seller
 * @description Read all the products from the DB
 * @access seller
 */
router.get("/seller", authenticate, authenticateSeller, listAllProductsToSeller)



/**
 * @method PATCH
 * @route /api/products/unlist/:id
 * @description Unlist a product by its ID
 * @access seller
 */
router.patch("/unlist/:id", authenticate, authenticateSeller, unlistProductValidator, unlistProduct)


/**
 * @method PATCH
 * @route /api/products/unlist/:id
 * @description list a product by its ID
 * @access seller
 */
router.patch("/unlist/:id", authenticate, authenticateSeller, listProductValidator, listProduct)


export default router