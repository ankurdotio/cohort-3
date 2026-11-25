import mongoose from "mongoose";


const contextSchema = new mongoose.Schema({
    context: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

const Context = mongoose.model("Context", contextSchema);
export default Context;