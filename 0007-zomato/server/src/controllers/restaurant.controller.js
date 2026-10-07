const Restaurant = require("../models/restaurant.model");
const MenuItem = require("../models/menuItem.model");
const getPagination = require("../utils/pagination");
const findOwnedRestaurant = require("../utils/ownership");
const Order = require("../models/order.model")
const mongoose = require("mongoose");

// Turns lng/lat from the request body into a GeoJSON point (or null if invalid)
function buildLocation(lng, lat) {
  const longitude = Number(lng);
  const latitude = Number(lat);

  const isValid =
    lng !== undefined && lat !== undefined &&
    Number.isFinite(longitude) && Number.isFinite(latitude) &&
    longitude >= -180 && longitude <= 180 &&
    latitude >= -90 && latitude <= 90;

  return isValid ? { type: "Point", coordinates: [ longitude, latitude ] } : null;
}

// GET /api/restaurants?page=1&limit=10&city=Bhopal
async function getRestaurants(req, res) {
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (req.query.city) {
    filter.city = String(req.query.city);
  }

  const [ restaurants, total ] = await Promise.all([
    Restaurant.find(filter).sort({ name: 1, _id: 1 }).skip(skip).limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  res.json({ page, limit, total, totalPages: Math.ceil(total / limit), restaurants });
}

// GET /api/restaurants/:id
async function getRestaurantById(req, res) {
  const restaurant = await Restaurant.findById(req.params.id).populate("owner", "name");
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }
  res.json({ restaurant });
}

// POST /api/restaurants  (owner)
// Body: { name, city, area, cuisines: [], lng, lat, isOpen }
async function createRestaurant(req, res) {
  const { name, city, area, cuisines, lng, lat, isOpen } = req.body;

  const location = buildLocation(lng, lat);
  if (!location) {
    return res.status(400).json({ message: "Valid lng and lat are required" });
  }

  const restaurant = await Restaurant.create({
    name,
    owner: req.user.id,
    city,
    area,
    cuisines,
    location,
    isOpen,
  });

  res.status(201).json({ restaurant });
}

// PATCH /api/restaurants/:id  (owner, own restaurant only)
async function updateRestaurant(req, res) {
  const { restaurant, error } = await findOwnedRestaurant(req.params.id, req.user.id);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  // Only these fields can be changed
  const allowedFields = [ "name", "city", "area", "cuisines", "isOpen" ];
  for (const field of allowedFields) {
    if (req.body[ field ] !== undefined) {
      restaurant[ field ] = req.body[ field ];
    }
  }

  if (req.body.lng !== undefined || req.body.lat !== undefined) {
    const location = buildLocation(req.body.lng, req.body.lat);
    if (!location) {
      return res.status(400).json({ message: "Send both lng and lat with valid values" });
    }
    restaurant.location = location;
  }

  await restaurant.save();
  res.json({ restaurant });
}

// DELETE /api/restaurants/:id  (owner, own restaurant only)
async function deleteRestaurant(req, res) {
  const { restaurant, error } = await findOwnedRestaurant(req.params.id, req.user.id);
  if (error) {
    return res.status(error.status).json({ message: error.message });
  }

  // Remove the menu too. Old orders and reviews are kept for history.
  await MenuItem.deleteMany({ restaurant: restaurant._id });
  await restaurant.deleteOne();

  res.json({ message: "Restaurant deleted" });
}


// GET /api/restaurants/:id/revenue  (owner, own restaurant only)
async function getRestaurantRevenue(req, res) {

  const id = req.params.id;
  const to = req.query.to ? new Date(req.query.to) : new Date();
  let from = req.query.from
    ? new Date(req.query.from)
    : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  from.setUTCHours(0, 0, 0, 0)

  /**
     * 
     * res = {
     * message: "Revenue details",
     * revenue: 12345, // example revenue amount
     * from: "2024-06-01", // example start date
     * to: "2024-06-07" // example end date
     * days:[
     *   {
     *     date: "2024-06-01", // example date
     *     revenue: 1234 // example revenue for the day
     *   },
     *   {
     *     date: "2024-06-02", // example date
     *     revenue: 2345 // example revenue for the day
     *   },
     *   {
     *     date: "2024-06-03", // example date
     *     revenue: 3456 // example revenue for the day
     *   },
     *   {
     *     date: "2024-06-04", // example date
     *     revenue: 4567 // example revenue for the day
     *   }
     * ]
     * }
     * 
     */

  const response = await Order.aggregate([
    {
      '$match': {
        'restaurant': new mongoose.Types.ObjectId(id),
        'status': 'delivered',
        'createdAt': {
          '$gte': from,
          '$lte': to
        }
      }
    }, {
      '$group': {
        '_id': {
          '$dateToString': {
            'format': '%Y-%m-%d',
            'date': '$createdAt',
            'timezone': 'UTC'
          }
        },
        'revenue': {
          '$sum': '$totalAmount'
        }
      }
    }, {
      '$sort': {
        '_id': 1
      }
    }, {
      '$project': {
        'date': '$_id',
        'revenue': 1,
        '_id': 0
      }
    }, {
      '$group': {
        '_id': null,
        'totalRevenue': {
          '$sum': '$revenue'
        },
        'days': {
          '$push': '$$ROOT'
        }
      }
    }
  ])


  const revenue = response.length > 0 ? response[ 0 ] : { totalRevenue: 0, days: [] };

  res.json({
    message: "Revenue details",
    revenue: revenue.totalRevenue,
    from: from.toISOString(),
    to: to.toISOString().split('T')[ 0 ],
    days: revenue.days
  })

}


// GET /restaurants/:id/top-customers 
async function getTopCustomers(req, res) {


  const { id } = req.params;


  const response = await Order.aggregate(
    [
      {
        '$match': {
          'restaurant': new mongoose.Types.ObjectId(id),
          'status': 'delivered'
        }
      }, {
        '$group': {
          '_id': '$customer',
          'totalRevenue': {
            '$sum': '$totalAmount'
          },
          'totalOrder': {
            '$sum': 1
          },
          'averageOrderValue': {
            '$avg': '$totalAmount'
          }
        }
      }, {
        '$sort': {
          'totalRevenue': -1
        }
      }, {
        '$limit': 3
      }, {
        '$lookup': {
          'from': 'users',
          'localField': '_id',
          'foreignField': '_id',
          'as': 'user',
          'pipeline': [
            {
              '$project': {
                'name': 1,
                'email': 1,
                '_id': 0
              }
            }
          ]
        }
      }, {
        '$unwind': {
          'path': '$user',
          'preserveNullAndEmptyArrays': true
        }
      }
    ])


  return res.json({
    message: "Top customers retrieved successfully",
    topCustomers: response
  })

}

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantRevenue,
  getTopCustomers
};
