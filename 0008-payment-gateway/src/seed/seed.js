import mongoose from "mongoose"
import connectToDB from "../config/db.js"
import Product from "../models/product.model.js"

const products = [
    { title: "Wireless Mouse", description: "Compact wireless mouse with USB receiver.", price: { amount: 599, currency: "INR" } },
    { title: "Mechanical Keyboard", description: "Backlit mechanical keyboard for everyday use.", price: { amount: 2499, currency: "INR" } },
    { title: "USB-C Cable", description: "One-meter USB-C charging and data cable.", price: { amount: 299, currency: "INR" } },
    { title: "Laptop Stand", description: "Adjustable aluminum stand for laptops.", price: { amount: 1299, currency: "INR" } },
    { title: "Bluetooth Speaker", description: "Portable speaker with rechargeable battery.", price: { amount: 1999, currency: "INR" } },
    { title: "Wireless Headphones", description: "Over-ear headphones with Bluetooth connectivity.", price: { amount: 3499, currency: "INR" } },
    { title: "Power Bank", description: "10000 mAh portable charger with dual USB ports.", price: { amount: 1499, currency: "INR" } },
    { title: "Phone Stand", description: "Foldable desk stand for smartphones.", price: { amount: 399, currency: "INR" } },
    { title: "Webcam", description: "Full HD webcam with built-in microphone.", price: { amount: 2199, currency: "INR" } },
    { title: "USB Hub", description: "Four-port USB hub for connecting accessories.", price: { amount: 799, currency: "INR" } }
]

async function seedProducts() {
    try {
        await connectToDB()
        const insertedProducts = await Product.insertMany(products)
        console.log(`Seeded ${insertedProducts.length} sample products`)
    } finally {
        await mongoose.disconnect()
    }
}

await seedProducts().catch((error) => {
    console.error("Failed to seed products:", error)
    process.exitCode = 1
})
