const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  category: { type: String, trim: true, default: "Other" },
  price: { type: Number, required: true, min: 0 },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
});



const menuItemModel = mongoose.model("MenuItem", menuItemSchema);

module.exports = menuItemModel;