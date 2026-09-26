import { body, param, validationResult } from "express-validator"

export const createProductValidator = [
    body("title")
        .exists().withMessage("Title is required").bail()
        .isString().withMessage("Title must be a string").bail()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Title length must be between 2 to 100 characters").bail()
        .isAlpha("en-US", { ignore: " -" }).withMessage("Title can only have english small case and capital case character"),
    body("description")
        .exists().withMessage("Description is required").bail()
        .isString().withMessage("Description must be String").bail()
        .trim()
        .isLength({ min: 20, max: 500 }).withMessage("Description length must be between 20 to 500 characters"),
    body("price.amount")
        .exists().withMessage("price amount is required").bail()
        .isFloat({ min: 0 }).withMessage("price amount must be a floating number and must be greater that 0"),
    body("price.currency")
        .exists().withMessage("Currency is required").bail()
        .isString().withMessage("Currency must be a string value")
        .isIn([ "INR", "USD" ]).withMessage("Currency either be INR or USD"),
    body("sizes")
        .exists().withMessage("Sizes are required").bail()
        .isArray().withMessage("Sizes must be an array of object"),
    body("sizes.*.size")
        .exists().withMessage("size must be present in every entry of sizes array").bail()
        .isString().withMessage("size must be a string value").bail()
        .trim()
        .isIn([ "XS", "S", "M", "L", "XL", "XXL" ]).withMessage("size can be one of these XS, S, M, L, XL, XXL."),
    body("sizes.*.stock")
        .exists().withMessage("stock must be present in every entry of the sizes array").bail()
        .isInt({ min: 0 }).withMessage("Stock must be a integer value"),
    (req, res, next) => {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "invalid Request",
                errors: errors.array()
            })
        }

        next()

    }

]

export const unlistProductValidator = [

    param("id")
        .exists().withMessage("product id is required in req params").bail()
        .isMongoId().withMessage("product is must be a valid mongo object id"),

    (req, res, next) => {

        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "invalid Data",
                errors: errors.array()
            })
        }

        next()

    }


]


export const listProductValidator = [

    param("id")
        .exists().withMessage("product id is required in req params").bail()
        .isMongoId().withMessage("product is must be a valid mongo object id"),

    (req, res, next) => {

        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "invalid Data",
                errors: errors.array()
            })
        }

        next()

    }


]