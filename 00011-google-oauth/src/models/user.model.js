import mongoose from "mongoose"



const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId
        }
    },
    googleId: {
        type: String,
    }
})

const userModel = mongoose.model("User", userSchema)

export default userModel