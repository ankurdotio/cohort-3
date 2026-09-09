import mongoose from "mongoose"


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: [ 3, "Name must be at least 3 characters long" ],
        maxLength: [ 50, "Name must be at most 50 characters long" ]
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    },
    passwordHash: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
    }
})

const userModel = mongoose.model("users", userSchema)

export default userModel