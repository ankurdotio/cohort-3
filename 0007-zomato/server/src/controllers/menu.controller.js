const Restaurant = require("../models/restaurant.model");
const MenuItem = require("../models/menuItem.model");
const findOwnedRestaurant = require("../utils/ownership");

// GET /api/restaurants/:id/menu?category=Starters&isVeg=true
async function getMenu(req, res) {

  console.time("getMenu:restaurant");

  const restaurant = await Restaurant.findById(req.params.id);


  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  console.timeEnd("getMenu:restaurant");


  const filter = { restaurant: restaurant._id };
  if (req.query.category) {
    filter.category = String(req.query.category);
  }
  if (req.query.isVeg !== undefined) {
    filter.isVeg = req.query.isVeg === "true";
  }

  console.time("getMenu:menuItems");
  const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 })
  console.timeEnd("getMenu:menuItems");


  res.json({ restaurant: { id: restaurant._id, name: restaurant.name }, count: menuItems.length, menuItems });
}

// POST /api/restaurants/:id/menu  (owner)
// Body: { name, category, price, isVeg, isAvailable }
async function createMenuItem(req, res) {
  const { restaurant, error } = await findOwnedRestaurant(req.params.id, req.user.id);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const { name, category, price, isVeg, isAvailable } = req.body;
  const menuItem = await MenuItem.create({
    restaurant: restaurant._id,
    name,
    category,
    price,
    isVeg,
    isAvailable,
  });

  res.status(201).json({ menuItem });
}

// PATCH /api/restaurants/:id/menu/:itemId  (owner)
async function updateMenuItem(req, res) {
  const { restaurant, error } = await findOwnedRestaurant(req.params.id, req.user.id);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const menuItem = await MenuItem.findOne({ _id: req.params.itemId, restaurant: restaurant._id });
  if (!menuItem) {
    return res.status(404).json({ message: "Menu item not found" });
  }

  const allowedFields = [ "name", "category", "price", "isVeg", "isAvailable" ];
  for (const field of allowedFields) {
    if (req.body[ field ] !== undefined) {
      menuItem[ field ] = req.body[ field ];
    }
  }

  await menuItem.save();
  res.json({ menuItem });
}

// DELETE /api/restaurants/:id/menu/:itemId  (owner)
async function deleteMenuItem(req, res) {
  const { restaurant, error } = await findOwnedRestaurant(req.params.id, req.user.id);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const menuItem = await MenuItem.findOneAndDelete({ _id: req.params.itemId, restaurant: restaurant._id });
  if (!menuItem) {
    return res.status(404).json({ message: "Menu item not found" });
  }

  res.json({ message: "Menu item deleted" });
}

module.exports = { getMenu, createMenuItem, updateMenuItem, deleteMenuItem };
