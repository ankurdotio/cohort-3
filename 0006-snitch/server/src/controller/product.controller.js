import productModel from "../models/product.model.js"




export async function createProduct(req, res) {

    console.log(req.body)
    console.log(req.files)

    res.status(200).json({
        message: "Dummy response"
    })
}