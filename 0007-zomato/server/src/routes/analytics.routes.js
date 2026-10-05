const express = require("express");
const {
  getRevenue,
  getTopDishes,
  getPeakHours,
  getStatusBreakdown,
  getTopCustomers,
  getRatings,
  getCityRevenue,
  getMonthlyTrend,
  searchRestaurants,
  getNearbyRestaurants,
} = require("../controllers/analytics.controller");
const { authUser, authorize } = require("../middlewares/auth.middleware");

// This router is mounted at /api (see app.js), so paths below are full paths.
const router = express.Router();

const ownerOnly = [authUser, authorize("owner")];

// Restaurant analytics (owner dashboard)
router.get("/analytics/restaurants/:id/revenue", ownerOnly, getRevenue);
router.get("/analytics/restaurants/:id/top-dishes", ownerOnly, getTopDishes);
router.get("/analytics/restaurants/:id/peak-hours", ownerOnly, getPeakHours);
router.get("/analytics/restaurants/:id/status-breakdown", ownerOnly, getStatusBreakdown);
router.get("/analytics/restaurants/:id/top-customers", ownerOnly, getTopCustomers);
router.get("/analytics/restaurants/:id/ratings", ownerOnly, getRatings);

// Platform analytics (any logged-in user for now; there is no admin role yet)
router.get("/analytics/platform/city-revenue", authUser, getCityRevenue);
router.get("/analytics/platform/monthly-trend", authUser, getMonthlyTrend);

// Public restaurant discovery
router.get("/restaurants/search", searchRestaurants);
router.get("/restaurants/nearby", getNearbyRestaurants);

module.exports = router;
