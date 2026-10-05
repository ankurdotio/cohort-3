const Restaurant = require("../models/restaurant.model");

// Loads a restaurant and checks that it belongs to the logged-in owner.
// Returns { restaurant } on success or { error: { status, message } } on failure.
async function findOwnedRestaurant(restaurantId, userId) {
  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return { error: { status: 404, message: "Restaurant not found" } };
  }
  if (restaurant.owner.toString() !== userId) {
    return { error: { status: 403, message: "You do not own this restaurant" } };
  }

  return { restaurant };
}

module.exports = findOwnedRestaurant;
