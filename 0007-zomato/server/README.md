# FoodHub API

A Zomato-style food ordering backend, built as a **teaching starter repo**.

The CRUD API and auth already work. Your job is to make it **fast** (indexes) and
**smart** (aggregation pipelines). To keep that work for you, this repo deliberately has:

- **no indexes** other than the default `_id` index (and `autoIndex: false` in the Mongoose connection)
- **no aggregation pipelines**. The analytics endpoints are stubs that return `501 Not Implemented`.

Stack: Node.js, Express 5, MongoDB with Mongoose, JWT (access + refresh tokens), plain JavaScript (CommonJS).

---

## Setup

Requirements: Node.js 20+ and a MongoDB server (local or Atlas).

```bash
npm install
cp .env.example .env      # then edit the secrets and MONGO_URI
npm run seed              # loads ~34 million documents, takes ~5 minutes (see "Seed data")
npm run dev               # starts the server with nodemon on http://localhost:3000
```

| Script          | What it does                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the server with auto-reload     |
| `npm start`     | Start the server                      |
| `npm run seed`  | Drop all collections and reseed       |

## Environment variables

| Variable               | Example                                  | Notes                                            |
| ---------------------- | ---------------------------------------- | ------------------------------------------------ |
| `PORT`                 | `3000`                                   |                                                  |
| `NODE_ENV`             | `development`                            | The refresh cookie is `secure` only in `production` |
| `MONGO_URI`            | `mongodb://127.0.0.1:27017/foodhub`      |                                                  |
| `ACCESS_TOKEN_SECRET`  | long random string                       | Generate one with `openssl rand -hex 32`         |
| `REFRESH_TOKEN_SECRET` | another long random string               | Must be different from the access secret         |
| `ACCESS_TOKEN_EXPIRY`  | `15m`                                    |                                                  |
| `REFRESH_TOKEN_EXPIRY` | `7d`                                     |                                                  |
| `CUSTOMER_COUNT`       | `900000`                                 | Seed only                                        |
| `OWNER_COUNT`          | `100000`                                 | Seed only                                        |
| `RESTAURANT_COUNT`     | `1000000`                                | Seed only. Each gets 15 to 25 menu items         |
| `ORDER_COUNT`          | `10000000`                               | Seed only. Lower it on a slow machine            |
| `REVIEW_COUNT`         | `2000000`                                | Seed only. Must be below ~85% of `ORDER_COUNT`   |
| `SEED_END_DATE`        | `2026-06-30`                             | Seed only. Orders cover the 12 months before this date. Empty means today |

## Seed data

`npm run seed` uses Faker with a fixed seed, so everyone gets the same data. Orders are placed
relative to today, though, so if you want the whole class to have **byte-identical** data
(same dates, same `_id`s), set the same `SEED_END_DATE` for everyone.

| Collection    | Count                                        | Data size (approx.) |
| ------------- | -------------------------------------------- | ------------------- |
| users         | 1,000,000 (900,000 customers, 100,000 owners) | 0.25 GB            |
| restaurants   | 1,000,000                                    | 0.27 GB             |
| menuitems     | ~20,000,000 (15 to 25 per restaurant)        | 2.5 GB              |
| orders        | 10,000,000                                   | 3.3 GB              |
| reviews       | 2,000,000                                    | 0.3 GB              |

That is about **34 million documents**, ~6.6 GB of data and ~2.2 GB on disk (WiredTiger
compresses it). On a modern laptop the seed takes about **5 minutes** and needs only
modest memory (well under 2 GB): documents are streamed to MongoDB in batches of 5,000 and never kept in memory.
Progress is logged roughly every 1% per collection.

Make sure you have **at least 5 GB of free disk space**. On a slow machine, or on the free
Atlas tier (512 MB limit), use a smaller data set by putting these lines in `.env`:

```bash
# Small preset: ~370,000 documents, takes a few seconds
CUSTOMER_COUNT=4700
OWNER_COUNT=300
RESTAURANT_COUNT=300
ORDER_COUNT=300000
REVIEW_COUNT=60000
```

Why so big? Without indexes, every query that filters or sorts has to scan the whole
collection. With millions of documents you will *feel* that (for example
`GET /api/restaurants/:id/menu` scans 20 million menu items and takes several seconds),
and you will see the difference once you add the right index. Use `.explain("executionStats")`
to compare `totalDocsExamined` before and after.

Restaurant names repeat (like branches of a chain), so never look a restaurant up by name.
Use its `_id`.

The data is shaped so that analytics give interesting answers:

- 8 Indian cities (Bhopal, Indore, Delhi, Mumbai, Bengaluru, Pune, Hyderabad, Jaipur). Restaurants are placed within about 10 km of the city centre as GeoJSON points.
- Orders cover the last 12 months, with busier weekends and slow growth over time.
- Order times peak at lunch (12 to 2 pm) and dinner (7 to 10 pm), in IST.
- About 20% of restaurants get about 60% of all orders.
- Customers mostly order from restaurants in their own city.
- Each order has 1 to 4 items, and `totalAmount` always equals the sum of `price × quantity`.
- About 85% of orders are delivered and 8% cancelled. The rest are placed or preparing.
- Reviews exist only for delivered orders, and ratings lean towards 4 and 5.

> ⚠️ Re-running the seed **drops every collection, including any indexes you created.**
> Keep your index definitions in code (or a script) so you can re-create them.

## Demo accounts

Password for both: **`password123`**

| Role     | Email                  | Notes                                       |
| -------- | ---------------------- | ------------------------------------------- |
| owner    | `owner@foodhub.com`    | Owns 10 restaurants, including the most popular one (in Bhopal, ~5,000 orders) |
| customer | `customer@foodhub.com` | Lives in Bhopal and has about 500 orders     |

The seed prints the demo restaurant's `_id` at the end. Use it in the restaurant routes below.
All other seeded users also have the password `password123`.

## Authentication

FoodHub uses an **access token** together with a **refresh token**.

| Token         | Lifetime | Where it lives                                                   | Payload        |
| ------------- | -------- | ---------------------------------------------------------------- | -------------- |
| Access token  | 15 min   | JSON response body. Keep it in memory and send it as `Authorization: Bearer <token>` | `{ id, role }` |
| Refresh token | 7 days   | `httpOnly` cookie named `refreshToken` (`sameSite: strict`, path `/api/auth`) | `{ id }`       |

How it works:

1. `POST /api/auth/login` (or `/register`) returns `accessToken` in the body and sets the `refreshToken` cookie.
2. Call protected routes with `Authorization: Bearer <accessToken>`.
3. When a route returns `401 { "message": "Access token expired" }`, call `POST /api/auth/refresh`.
   The browser sends the cookie automatically. You get a new access token, **and the refresh token
   is rotated**: the old one stops working.
4. `POST /api/auth/logout` invalidates the refresh token and clears the cookie.

Only a hash of the current refresh token is stored in the database (`user.refreshToken`).

Example with curl:

```bash
curl -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"owner@foodhub.com","password":"password123"}' \
  http://localhost:3000/api/auth/login

curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/refresh
```

## Routes

Auth column: **public**: no token needed · **user**: any logged-in user · **owner** / **customer**: that role only.
Owner routes on a restaurant also check that the restaurant belongs to the logged-in owner.

### Auth

| Method | Path                  | Auth   | Description                                              |
| ------ | --------------------- | ------ | -------------------------------------------------------- |
| POST   | `/api/auth/register`  | public | Body: `name, email, password, role?, city?`. `role` is `customer` (default) or `owner` |
| POST   | `/api/auth/login`     | public | Body: `email, password`                                  |
| POST   | `/api/auth/refresh`   | cookie | Get a new access token and rotate the refresh token      |
| POST   | `/api/auth/logout`    | cookie | Invalidate the refresh token and clear the cookie        |
| GET    | `/api/auth/me`        | user   | The current user's profile                               |

### Restaurants and menu

| Method | Path                                     | Auth   | Description                                         |
| ------ | ---------------------------------------- | ------ | --------------------------------------------------- |
| GET    | `/api/restaurants?page=&limit=&city=`    | public | Paginated list, optionally filtered by city         |
| GET    | `/api/restaurants/:id`                   | public | One restaurant                                      |
| POST   | `/api/restaurants`                       | owner  | Body: `name, city, area, cuisines[], lng, lat, isOpen?` |
| PATCH  | `/api/restaurants/:id`                   | owner  | Update your own restaurant                          |
| DELETE | `/api/restaurants/:id`                   | owner  | Delete your own restaurant and its menu             |
| GET    | `/api/restaurants/:id/menu?category=&isVeg=` | public | The restaurant's menu                           |
| POST   | `/api/restaurants/:id/menu`              | owner  | Body: `name, category, price, isVeg, isAvailable?`  |
| PATCH  | `/api/restaurants/:id/menu/:itemId`      | owner  | Update a menu item                                  |
| DELETE | `/api/restaurants/:id/menu/:itemId`      | owner  | Delete a menu item                                  |

### Orders

| Method | Path                                         | Auth     | Description                                      |
| ------ | -------------------------------------------- | -------- | ------------------------------------------------ |
| POST   | `/api/orders`                                | customer | Body: `restaurantId, items: [{ menuItemId, quantity }], paymentMethod` (`upi`, `card`, `cod`). Name, price and total are worked out on the server |
| GET    | `/api/orders/my?page=&limit=`                | customer | Your orders, newest first                        |
| GET    | `/api/restaurants/:id/orders?page=&limit=&status=` | owner | Orders for your restaurant, newest first   |
| PATCH  | `/api/orders/:id/status`                     | owner    | Body: `status`. Allowed moves: `placed → preparing / cancelled`, `preparing → delivered / cancelled` |

### Reviews

| Method | Path                                        | Auth     | Description                                         |
| ------ | ------------------------------------------- | -------- | --------------------------------------------------- |
| POST   | `/api/reviews`                              | customer | Body: `orderId, rating (1 to 5), comment?`. Only for your own delivered order, and only one review per order |
| GET    | `/api/restaurants/:id/reviews?page=&limit=` | public   | Reviews for a restaurant, newest first              |

### Analytics (stubs, these are your tasks)

| Method | Path                                                | Auth   |
| ------ | --------------------------------------------------- | ------ |
| GET    | `/api/analytics/restaurants/:id/revenue?from=&to=`  | owner  |
| GET    | `/api/analytics/restaurants/:id/top-dishes?limit=`  | owner  |
| GET    | `/api/analytics/restaurants/:id/peak-hours`         | owner  |
| GET    | `/api/analytics/restaurants/:id/status-breakdown`   | owner  |
| GET    | `/api/analytics/restaurants/:id/top-customers`      | owner  |
| GET    | `/api/analytics/restaurants/:id/ratings`            | owner  |
| GET    | `/api/analytics/platform/city-revenue`              | user   |
| GET    | `/api/analytics/platform/monthly-trend`             | user   |
| GET    | `/api/restaurants/search?q=&city=&cuisine=&page=`   | public |
| GET    | `/api/restaurants/nearby?lng=&lat=&radius=`         | public |

All of these currently return `501 { "message": "Not implemented yet" }`.

## Your tasks

Each stub in [`src/controllers/analytics.controller.js`](src/controllers/analytics.controller.js)
has a comment block with the exact task, its query params, and an example response. Implement them
with **aggregation pipelines**, and then add the **indexes** that make them fast.

1. **Daily revenue**: revenue and order count per day for a restaurant, between `from` and `to`.
2. **Top dishes**: best-selling dishes by quantity sold and by revenue.
3. **Peak hours**: order count for each hour of the day (0 to 23).
4. **Status breakdown**: count and percentage of orders in each status.
5. **Top customers**: the 10 customers who spent the most, with their name and email.
6. **Ratings summary**: average rating, count for each star, and the 5 latest reviews with the customer's name.
7. **City revenue (platform)**: revenue and order count for each city, sorted.
8. **Monthly trend (platform)**: revenue for each of the last 12 months.
9. **Search**: one response with the results, the total count, and the count per cuisine (hint: `$facet`, text index).
10. **Nearby (stretch)**: restaurants near a point, with their distance (hint: `2dsphere` index, `$geoNear`).

Tips:

- Usually only `delivered` orders count as revenue. Decide on a rule and stick to it.
- Group by date and hour in the `Asia/Kolkata` timezone (`$dateToString` / `$hour` accept a `timezone`).
- Check every query with `.explain("executionStats")` before and after adding an index, and compare
  `totalDocsExamined` with `nReturned`.
- Good candidates to think about: a unique index on `users.email`, `{ restaurant: 1, createdAt: -1 }` on orders,
  a text index on restaurants, and a `2dsphere` index on `restaurants.location`.
- Mongoose's `autoIndex` is `false`, so indexes you declare in a schema are **not** built automatically.
  Call `Model.syncIndexes()` / `createIndexes()`, or create them in `mongosh`.

## Project structure

```
src/
  app.js                 Express app, middleware, route mounting
  server.js              Connects to MongoDB and starts the server
  config/env.js          Loads .env and exports every setting (the only file that reads process.env)
  config/db.js           Mongoose connection (autoIndex: false)
  models/                User, Restaurant, MenuItem, Order, Review
  controllers/           Route handlers (they talk to the models directly)
  routes/                Express routers
  middlewares/           auth.middleware.js (authUser, authorize), error.middleware.js
  utils/                 token.js, pagination.js, ownership.js
  seed/                  seed.js and its static data (data.js)
```
