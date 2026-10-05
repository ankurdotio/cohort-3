const Review = require("../models/review.model");
const Order = require("../models/order.model");
const Restaurant = require("../models/restaurant.model");
const getPagination = require("../utils/pagination");

// POST /api/reviews  (customer)
// Body: { orderId, rating, comment }
async function createReview(req, res) {
  const { orderId, rating, comment } = req.body;

  if (typeof orderId !== "string") {
    return res.status(400).json({ message: "orderId is required" });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "rating must be a whole number from 1 to 5" });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.customer.toString() !== req.user.id) {
    return res.status(403).json({ message: "You can only review your own orders" });
  }
  if (order.status !== "delivered") {
    return res.status(400).json({ message: "You can only review a delivered order" });
  }

  // One review per order
  const existingReview = await Review.findOne({ order: order._id });
  if (existingReview) {
    return res.status(409).json({ message: "You already reviewed this order" });
  }

  const review = await Review.create({
    customer: req.user.id,
    restaurant: order.restaurant,
    order: order._id,
    rating,
    comment,
  });

  res.status(201).json({ review });
}

// GET /api/restaurants/:id/reviews?page=1&limit=10
async function getRestaurantReviews(req, res) {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { restaurant: restaurant._id };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "name"),
    Review.countDocuments(filter),
  ]);

  res.json({ page, limit, total, totalPages: Math.ceil(total / limit), reviews });
}

module.exports = { createReview, getRestaurantReviews };
