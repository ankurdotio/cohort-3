import userModel from "../models/user.model.js"

/**
 * req.body = {email,phone,password}
 * 
 *  * req.body = {
 * email:"jhsdfghjds",
 * phone:"kjsdfnkjds",
 * password:"         "
 * }
 * 
 */
export async function register(req, res) {

    const { email, phone, password } = req.body

    const user = await userModel.create({
        email,
        phone,
        password: password// hash(password)
    })

    res.status(201).json({
        message: "User registered Successfully",
        data: {
            email,
            phone,
            id: user._id
        }
    })
}

/**
 * 
 * 
 * req.body = {
 * email:"jhsdfghjds",
 * phone:"kjsdfnkjds",
 * password:""
 * }
 * 
 * res.status = 400
 * res.body = {
 * message:"Invalid data",
 * errors:[
 *  {
 *      field:email
 *      message:"Invalid email"
 *  },
 *  {
 *      field:"phone",
 *      message:"Invalid Phone Number"
 *  },
 *  {
 *      field:"password",
 *      message:"Password is required, received empty String"
 * }
 * ]
 * }
 * 
 * 
 * 
 */