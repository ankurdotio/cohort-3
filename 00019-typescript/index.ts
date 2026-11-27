/**
 * inference
 * annotation
 * any
 */



/**
 * arrays
 */
let items: Array<string | number> = [1, "two", 3, "four"];

items.push(44)
items.push("fifty-five")

/**
 * tuples
 */
let location: [number, number] = [40.7128, -74.0060];

// let user: [string, number] = ["Alice", 30]


/**
 * empty array
 */
let b: readonly string[] = ["apple", "orange", "banana"];

let embedding: number[]


/**
 * Object types
 */

// let user: {
//     name?: string,
//     email: string,
//     age?: number
// };


// user = {
//     name: "Alice",
//     email: "alice@example.com",
//     age: 30,
// }

// if (user.email)
// console.log(user.email.toUpperCase())

// if (user.age)
//     console.log(user.age + 25)



/**
 * Type aliases
 */

type User = {
    readonly _id: string,
    name: string,
    email: string,
    age: number
}

type Product = {
    readonly _id: string,
    name: string,
    description: string,
    price: number
}



let user: User

user = {
    _id: "123",
    name: "Alice",
    email: "alice@example.com",
    age: 30,
}

let product: Product

product = {
    _id: "456",
    name: "Laptop",
    description: "A high-performance laptop",
    // price: 1200
}