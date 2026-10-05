// ============================================================================
// ANALYTICS STUBS - YOUR TASKS
// Every function below returns 501 for now. Replace the body with a MongoDB
// aggregation pipeline (Order.aggregate([...]) / Review.aggregate / ...).
//
// Tips:
// - Convert route ids with new mongoose.Types.ObjectId(req.params.id) inside $match.
// - Seed data uses Indian time. Pass timezone: "Asia/Kolkata" to $hour,
//   $dayOfWeek and $dateToString so hours and days come out right.
// - Usually only "delivered" orders count as revenue.
// - For restaurant analytics, check the restaurant belongs to req.user.id
//   (see src/utils/ownership.js).
// - Run .explain("executionStats") on your pipelines and add indexes to the
//   models to make them fast. That is part of the task.
// ============================================================================

function notImplemented(req, res) {
  res.status(501).json({ message: "Not implemented yet" });
}

/*
 * TASK 1: Daily revenue
 * GET /api/analytics/restaurants/:id/revenue?from=2026-01-01&to=2026-01-31
 *
 * Daily revenue and number of delivered orders for one restaurant,
 * between "from" and "to" (inclusive). Default: last 30 days. Sort by date ascending.
 *
 * Query params:
 *   from  (optional) start date, YYYY-MM-DD
 *   to    (optional) end date, YYYY-MM-DD
 *
 * Example response:
 * {
 *   "restaurantId": "665f1c2e9b1e8a0012345678",
 *   "from": "2026-01-01",
 *   "to": "2026-01-31",
 *   "totalRevenue": 412350,
 *   "totalOrders": 921,
 *   "days": [
 *     { "date": "2026-01-01", "revenue": 15230, "orders": 34 },
 *     { "date": "2026-01-02", "revenue": 11890, "orders": 27 }
 *   ]
 * }
 */
async function getRevenue(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 2: Top dishes
 * GET /api/analytics/restaurants/:id/top-dishes?limit=5
 *
 * Best-selling dishes of one restaurant (delivered orders only).
 * Hint: $unwind the items array, then $group by menu item.
 *
 * Query params:
 *   limit  (optional) how many dishes to return, default 5
 *
 * Example response:
 * {
 *   "dishes": [
 *     { "menuItemId": "665f...01", "name": "Chicken Dum Biryani", "quantitySold": 2140, "revenue": 599200 },
 *     { "menuItemId": "665f...02", "name": "Paneer Tikka", "quantitySold": 1755, "revenue": 421200 }
 *   ]
 * }
 */
async function getTopDishes(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 3: Peak hours
 * GET /api/analytics/restaurants/:id/peak-hours
 *
 * Number of orders for each hour of the day (0 to 23, Indian time).
 * Hours with no orders should still appear with count 0.
 *
 * Example response:
 * {
 *   "hours": [
 *     { "hour": 0, "orders": 12 },
 *     { "hour": 1, "orders": 5 },
 *     ...
 *     { "hour": 20, "orders": 1630 }
 *   ],
 *   "peakHour": 20
 * }
 */
async function getPeakHours(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 4: Status breakdown
 * GET /api/analytics/restaurants/:id/status-breakdown
 *
 * Count and percentage of orders for each status. Percentages rounded to 1 decimal.
 * Hint: $group by status, or try $facet / $setWindowFields for the total.
 *
 * Example response:
 * {
 *   "total": 9874,
 *   "statuses": [
 *     { "status": "delivered", "count": 8390, "percentage": 85.0 },
 *     { "status": "cancelled", "count": 801, "percentage": 8.1 },
 *     { "status": "placed", "count": 344, "percentage": 3.5 },
 *     { "status": "preparing", "count": 339, "percentage": 3.4 }
 *   ]
 * }
 */
async function getStatusBreakdown(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 5: Top customers
 * GET /api/analytics/restaurants/:id/top-customers
 *
 * Top 10 customers of this restaurant by total amount spent (delivered orders).
 * Hint: $group by customer, $sort, $limit, then $lookup into users.
 *
 * Example response:
 * {
 *   "customers": [
 *     { "customerId": "665f...aa", "name": "Aarav Sharma", "email": "aarav.sharma12@example.com", "orders": 41, "totalSpent": 23840 },
 *     { "customerId": "665f...bb", "name": "Diya Patel", "email": "diya.patel88@example.com", "orders": 37, "totalSpent": 21115 }
 *   ]
 * }
 */
async function getTopCustomers(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 6: Ratings summary
 * GET /api/analytics/restaurants/:id/ratings
 *
 * Average rating (1 decimal), total reviews, count for each star (1 to 5)
 * and the 5 latest reviews with the customer's name.
 * Hint: one $facet with three sub-pipelines.
 *
 * Example response:
 * {
 *   "averageRating": 4.1,
 *   "totalReviews": 1834,
 *   "stars": { "1": 92, "2": 101, "3": 240, "4": 560, "5": 841 },
 *   "latestReviews": [
 *     { "rating": 5, "comment": "Loved it!", "customerName": "Rohan Gupta", "createdAt": "2026-09-30T14:22:10.000Z" }
 *   ]
 * }
 */
async function getRatings(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 7: Revenue per city (platform)
 * GET /api/analytics/platform/city-revenue
 *
 * Revenue and delivered order count for every city, highest revenue first.
 * Hint: orders do not store the city. $lookup the restaurant first
 * (or think about whether you should store the city on the order).
 *
 * Example response:
 * {
 *   "cities": [
 *     { "city": "Delhi", "revenue": 31245000, "orders": 50112 },
 *     { "city": "Mumbai", "revenue": 30310000, "orders": 48870 }
 *   ]
 * }
 */
async function getCityRevenue(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 8: Monthly trend (platform)
 * GET /api/analytics/platform/monthly-trend
 *
 * Revenue and delivered order count per month for the last 12 months, oldest first.
 *
 * Example response:
 * {
 *   "months": [
 *     { "month": "2025-10", "revenue": 12450300, "orders": 19876 },
 *     { "month": "2025-11", "revenue": 12990100, "orders": 20511 }
 *   ]
 * }
 */
async function getMonthlyTrend(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 9: Restaurant search with facets
 * GET /api/restaurants/search?q=biryani&city=Pune&cuisine=Biryani&page=1
 *
 * Search restaurants by name (q), with optional city and cuisine filters.
 * Return in ONE response: a page of results (10 per page), the total count,
 * and how many matching restaurants exist per cuisine.
 * Hint: $match, then $facet. Try a text index for q.
 *
 * Query params:
 *   q        (optional) text to search in the restaurant name
 *   city     (optional) exact city
 *   cuisine  (optional) one cuisine
 *   page     (optional) default 1
 *
 * Example response:
 * {
 *   "page": 1,
 *   "total": 14,
 *   "results": [ { "_id": "665f...", "name": "Royal Biryani House", "city": "Pune", "area": "Baner", "cuisines": ["Biryani", "North Indian"] } ],
 *   "cuisineCounts": [ { "cuisine": "Biryani", "count": 14 }, { "cuisine": "North Indian", "count": 6 } ]
 * }
 */
async function searchRestaurants(req, res) {
  notImplemented(req, res);
}

/*
 * TASK 10 (stretch): Nearby restaurants
 * GET /api/restaurants/nearby?lng=77.4126&lat=23.2599&radius=3000
 *
 * Restaurants within "radius" metres of a point, nearest first, with the distance.
 * Hint: $geoNear must be the first stage and needs a 2dsphere index on location.
 *
 * Query params:
 *   lng, lat  (required) the user's position
 *   radius    (optional) metres, default 5000
 *
 * Example response:
 * {
 *   "count": 2,
 *   "restaurants": [
 *     { "_id": "665f...", "name": "Shree Udupi", "area": "MP Nagar", "distanceInMeters": 412 },
 *     { "_id": "665f...", "name": "Tadka Dhaba", "area": "Arera Colony", "distanceInMeters": 1288 }
 *   ]
 * }
 */
async function getNearbyRestaurants(req, res) {
  notImplemented(req, res);
}

module.exports = {
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
};
