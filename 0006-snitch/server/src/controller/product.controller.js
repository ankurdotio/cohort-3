import productModel from "../models/product.model.js"
import { uploadFile } from "../services/storage.service.js"




export async function createProduct(req, res) {

    console.log(req.body)
    console.log(req.files)

    const filesUrls = []

    for (let i = 0; i < req.files.length; i++) {

        const response = await uploadFile({
            buffer: req.files[ i ].buffer,
            fileName: req.files[ i ].originalname
        })

        filesUrls.push(response.url)
    }

    console.log(filesUrls)


    const product = await productModel.create({
        title: req.body.title,
        description: req.body.description,
        price: {
            amount: req.body.price.amount,
            currency: req.body.price.currency
        },
        sizes: req.body.sizes,
        images: filesUrls,
        seller: req.user.userId
    })


    res.status(201).json({
        message: "Product created successfully",
        data: {
            product
        }
    })
}

export async function listAllProducts(req, res) {

    const products = await productModel.find()

    res.status(200).json({
        message: "Products data fetched successfully",
        data: {
            products
        }
    })

}