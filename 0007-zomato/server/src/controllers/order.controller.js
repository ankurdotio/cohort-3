const Order = require("../models/order.model");
const Restaurant = require("../models/restaurant.model");
const MenuItem = require("../models/menuItem.model");
const getPagination = require("../utils/pagination");
const findOwnedRestaurant = require("../utils/ownership");

const PAYMENT_METHODS = ["upi", "card", "cod"];

// Which status an order is allowed to move to next
const NEXT_STATUSES = {
  placed: ["preparing", "cancelled"],
  preparing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// POST /api/orders  (customer)
// Body: { restaurantId, paymentMethod, items: [{ menuItemId, quantity }] }
async function createOrder(req, res) {
  const { restaurantId, items, paymentMethod = "cod" } = req.body;

  if (typeof restaurantId !== "string" || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "restaurantId and at least one item are required" });
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: "paymentMethod must be upi, card or cod" });
  }
  for (const item of items) {
    if (typeof item.menuItemId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return res.status(400).json({ message: "Each item needs a menuItemId and a quantity from 1 to 20" });
    }
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }
  if (!restaurant.isOpen) {
    return res.status(400).json({ message: "Restaurant is closed right now" });
  }

  // Load all requested menu items in one query, only from this restaurant
  const menuItemIds = items.map((item) => item.menuItemId);
  const menuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    restaurant: restaurant._id,
    isAvailable: true,
  });

  // Never trust prices from the client: copy name and price from the database
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const menuItem = menuItems.find((m) => m._id.toString() === item.menuItemId);
    if (!menuItem) {
      return res.status(400).json({ message: `Menu item ${item.menuItemId} is not available in this restaurant` });
    }

    orderItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
    });
    totalAmount += menuItem.price * item.quantity;
  }

  const order = await Order.create({
    customer: req.user.id,
    restaurant: restaurant._id,
    items: orderItems,
    totalAmount,
    paymentMethod,
    status: "placed",
  });

  res.status(201).json({ order });
}

// GET /api/orders/my?page=1&limit=10  (customer)
async function getMyOrders(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { customer: req.user.id };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("restaurant", "name city area"),
    Order.countDocuments(filter),
  ]);

  res.json({ page, limit, total, totalPages: Math.ceil(total / limit), orders });
}

// GET /api/restaurants/:id/orders?page=1&limit=10&status=placed  (owner)
async function getRestaurantOrders(req, res) {
  const { restaurant, error } = await findOwnedRestaurant(req.params.id, req.user.id);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { restaurant: restaurant._id };
  if (req.query.status) {
    filter.status = String(req.query.status);
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "name"),
    Order.countDocuments(filter),
  ]);

  res.json({ page, limit, total, totalPages: Math.ceil(total / limit), orders });
}

// PATCH /api/orders/:id/status  (owner)
// Body: { status: "preparing" | "delivered" | "cancelled" }
async function updateOrderStatus(req, res) {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // The order must belong to a restaurant owned by this owner
  const { error } = await findOwnedRestaurant(order.restaurant, req.user.id);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  const allowed = NEXT_STATUSES[order.status];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      message: `Cannot change status from "${order.status}" to "${status}". Allowed: ${allowed.join(", ") || "none"}`,
    });
  }

  order.status = status;
  await order.save();
  res.json({ order });
}

module.exports = { createOrder, getMyOrders, getRestaurantOrders, updateOrderStatus };
