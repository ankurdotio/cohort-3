const express = require("express");
const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantRevenue,
  getTopCustomers,
} = require("../controllers/restaurant.controller");
const { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } = require("../controllers/menu.controller");
const { getRestaurantOrders } = require("../controllers/order.controller");
const { getRestaurantReviews } = require("../controllers/review.controller");
const { authUser, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

// Restaurants
router.get("/", getRestaurants);
router.get("/:id", getRestaurantById);
router.post("/", authUser, authorize("owner"), createRestaurant);
router.patch("/:id", authUser, authorize("owner"), updateRestaurant);
router.delete("/:id", authUser, authorize("owner"), deleteRestaurant);

// Menu of a restaurant
router.get("/:id/menu", getMenu);
router.post("/:id/menu", authUser, authorize("owner"), createMenuItem);
router.patch("/:id/menu/:itemId", authUser, authorize("owner"), updateMenuItem);
router.delete("/:id/menu/:itemId", authUser, authorize("owner"), deleteMenuItem);

// Orders of a restaurant (owner dashboard)
router.get("/:id/orders", authUser, authorize("owner"), getRestaurantOrders);

// Reviews of a restaurant
router.get("/:id/reviews", getRestaurantReviews);

// Revenue of a restaurant (owner dashboard)
router.get("/:id/revenue", authUser, authorize("owner"), getRestaurantRevenue);


// /restaurants/:id/top-customers
router.get("/:id/top-customers", authUser, authorize("owner"), getTopCustomers)

module.exports = router;
