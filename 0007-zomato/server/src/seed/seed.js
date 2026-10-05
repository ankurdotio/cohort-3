// Seeds the database with realistic, repeatable Indian food-ordering data.
// Run with: npm run seed
//
// The default data set is BIG (millions of documents), so this script never keeps
// whole documents in memory. For every user, restaurant and menu item it only
// remembers a few numbers (in typed arrays like Uint32Array) and streams the
// documents into MongoDB 5,000 at a time.
const env = require("../config/env");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { fakerEN_IN: faker } = require("@faker-js/faker");

const connectDB = require("../config/db");
const User = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");
const MenuItem = require("../models/menuItem.model");
const Order = require("../models/order.model");
const Review = require("../models/review.model");
const {
  CITIES,
  CUISINES,
  DISHES,
  BEVERAGES,
  NAME_PREFIXES,
  NAME_SUFFIXES,
  HOUR_WEIGHTS,
  REVIEW_COMMENTS,
} = require("./data");

// ---------------------------------------------------------------------------
// Settings (counts can be changed with env variables, see .env.example)
// ---------------------------------------------------------------------------
const SETTINGS = {
  customers: env.CUSTOMER_COUNT,
  owners: env.OWNER_COUNT,
  restaurants: env.RESTAURANT_COUNT,
  orders: env.ORDER_COUNT,
  reviews: env.REVIEW_COUNT,
  minMenuItems: 15,
  maxMenuItems: 25,
  batchSize: 5000,
};

const PASSWORD = "password123";
const DEMO_OWNER_EMAIL = "owner@foodhub.com";
const DEMO_CUSTOMER_EMAIL = "customer@foodhub.com";
const DEMO_CITY_INDEX = CITIES.findIndex((c) => c.name === "Bhopal");

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // India is UTC+5:30

// Fixed seed -> every student gets exactly the same data
faker.seed(2026);

// Orders cover the 365 days before END_DAY (midnight UTC of SEED_END_DATE or today)
const endDate = env.SEED_END_DATE ? new Date(env.SEED_END_DATE) : new Date();
if (Number.isNaN(endDate.getTime())) {
  throw new Error("SEED_END_DATE must look like 2026-10-01");
}
const END_DAY = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

// ---------------------------------------------------------------------------
// Random helpers (all use faker, so they follow the fixed seed)
// ---------------------------------------------------------------------------
const random = () => faker.number.float(); // 0 <= n < 1
const randomInt = (min, max) => faker.number.int({ min, max });
const pickOne = (list) => list[Math.floor(random() * list.length)];

// Binary search: first position in [low, high] whose running total is bigger than target
function firstAbove(runningTotals, target, low, high) {
  while (low < high) {
    const mid = (low + high) >> 1;
    if (runningTotals[mid] > target) high = mid;
    else low = mid + 1;
  }
  return low;
}

// Returns a function that picks an index. Bigger weight = picked more often.
function weightedPicker(weights) {
  const runningTotals = new Float64Array(weights.length);
  let total = 0;
  for (let i = 0; i < weights.length; i++) {
    total += weights[i];
    runningTotals[i] = total;
  }
  return () => firstAbove(runningTotals, random() * total, 0, runningTotals.length - 1);
}

// Same idea for tiny lists, without building a picker first
function pickWeightedIndex(weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let target = random() * total;
  for (let i = 0; i < weights.length; i++) {
    target -= weights[i];
    if (target < 0) return i;
  }
  return weights.length - 1;
}

// A random time between two dates, in whole seconds since 1970
function randomSeconds(fromMs, toMs) {
  return Math.floor((fromMs + random() * (toMs - fromMs)) / 1000);
}

// Random point within maxKm of a city centre. Returns [lng, lat].
function randomPointNear(lat, lng, maxKm = 10) {
  const distanceKm = maxKm * Math.sqrt(random()); // sqrt spreads points evenly
  const angle = random() * 2 * Math.PI;
  const dLat = (distanceKm / 111) * Math.cos(angle);
  const dLng = (distanceKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
  return [Number((lng + dLng).toFixed(6)), Number((lat + dLat).toFixed(6))];
}

// Repeatable ObjectIds: 4 bytes time + 2 bytes collection tag + 6 bytes counter.
// The time part matches createdAt, and the ids are the same on every machine.
// Because of this we never need to store ids: we can rebuild them from (seconds, counter).
const ID_TAG = { user: 1, restaurant: 2, menuItem: 3, order: 4, review: 5 };
function makeId(seconds, tag, counter) {
  const hex = seconds.toString(16).padStart(8, "0") + tag.toString(16).padStart(4, "0") + counter.toString(16).padStart(12, "0");
  return new mongoose.Types.ObjectId(hex);
}

const format = (n) => n.toLocaleString("en-US");

// ---------------------------------------------------------------------------
// Order patterns
// ---------------------------------------------------------------------------
const pickHour = weightedPicker(HOUR_WEIGHTS);
const pickItemCount = weightedPicker([35, 35, 20, 10]); // 1, 2, 3 or 4 items
const pickQuantity = weightedPicker([75, 20, 5]); // quantity 1, 2 or 3

const STATUSES = ["delivered", "cancelled", "placed", "preparing"];
const pickStatus = weightedPicker([85, 8, 3.5, 3.5]);

const PAYMENT_METHODS = ["upi", "card", "cod"];
const pickPayment = weightedPicker([55, 20, 25]);

const pickCity = weightedPicker(CITIES.map((c) => c.weight));
const pickCuisine = weightedPicker(CUISINES.map((c) => c.weight));

// Index = day of week (0 = Sunday). Weekends get the most orders.
const DAY_OF_WEEK_WEIGHT = [1, 0.65, 0.65, 0.65, 0.7, 0.85, 1];

// A random order time in the last 12 months (Indian time)
function randomOrderDate() {
  let dayStart;
  while (true) {
    const daysAgo = randomInt(1, 365);
    dayStart = END_DAY - daysAgo * DAY_MS;
    const dayWeight = DAY_OF_WEEK_WEIGHT[new Date(dayStart).getUTCDay()];
    const growth = 0.7 + 0.3 * (1 - daysAgo / 365); // business grows during the year
    if (random() < dayWeight * growth) break;
  }

  const secondsIntoDay = pickHour() * 3600 + randomInt(0, 3599);
  // Local Indian time -> UTC
  return new Date(dayStart + secondsIntoDay * 1000 - IST_OFFSET_MS);
}

// Ratings lean towards 4 and 5. Better restaurants (higher quality) get more 5s.
function pickRating(quality) {
  return pickWeightedIndex([6 * (1 - quality), 6 * (1 - quality), 13, 30 * (1 + quality / 2), 45 * (1 + quality)]) + 1;
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------
const MODELS = [User, Restaurant, MenuItem, Order, Review];

async function dropCollections() {
  await Promise.all(MODELS.map((Model) => Model.init()));

  const existing = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  const existingNames = existing.map((c) => c.name);

  for (const Model of MODELS) {
    const name = Model.collection.collectionName;
    if (existingNames.includes(name)) {
      await Model.collection.drop();
      console.log(`Dropped collection: ${name}`);
    }
  }
}

// Collects documents and inserts them in batches of 5,000 with the native driver.
// (Model.collection.insertMany skips Mongoose validation and keeps our createdAt.)
// While one batch is being inserted, we already build the next one.
// Progress is logged roughly every 1% so the console stays readable.
function createBatchWriter(Model, label, expectedTotal) {
  let batch = [];
  let inserted = 0;
  let running = Promise.resolve();
  let failure = null;
  const logEvery = Math.max(SETTINGS.batchSize, Math.ceil(expectedTotal / 100));
  let nextLogAt = logEvery;

  function logProgress(force) {
    if (!force && inserted < nextLogAt) return;
    while (nextLogAt <= inserted) nextLogAt += logEvery;
    const percent = Math.min(100, (inserted / expectedTotal) * 100).toFixed(0);
    console.log(`  ${label}: ${format(inserted)} (~${percent}%)`);
  }

  async function flush() {
    if (batch.length === 0) return;
    const docs = batch;
    batch = [];
    await running; // only one insert at a time
    if (failure) throw failure;
    running = Model.collection
      .insertMany(docs, { ordered: false })
      .then(() => {
        inserted += docs.length;
        logProgress(false);
      })
      .catch((err) => {
        failure = err;
      });
  }

  return {
    async add(doc) {
      batch.push(doc);
      if (batch.length >= SETTINGS.batchSize) await flush();
    },
    async finish() {
      await flush();
      await running;
      if (failure) throw failure;
      if (inserted % logEvery !== 0) logProgress(true);
      return inserted;
    },
  };
}

function makeEmail(firstName, lastName, number) {
  const clean = (text) => text.toLowerCase().replace(/[^a-z]/g, "");
  return `${clean(firstName)}.${clean(lastName)}${number}@example.com`;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

// Every dish gets a number, so a menu item only needs to remember that number
const ALL_DISHES = [...Object.values(DISHES).flat(), ...BEVERAGES];
const DISH_NUMBER = new Map(ALL_DISHES.map((dish, i) => [dish, i]));

function buildRestaurant(i, isPopular, ownerId) {
  const cityIndex = i === 0 ? DEMO_CITY_INDEX : pickCity();
  const city = CITIES[cityIndex];
  const area = pickOne(city.areas);

  // Main cuisine + 1 or 2 more
  const mainCuisine = CUISINES[pickCuisine()].name;
  const cuisines = [mainCuisine];
  const extraCount = randomInt(1, 2);
  while (cuisines.length < extraCount + 1) {
    const cuisine = CUISINES[pickCuisine()].name;
    if (!cuisines.includes(cuisine)) cuisines.push(cuisine);
  }

  // Names repeat a lot (like branches of a chain). Some add the area to stand out.
  let name = `${pickOne(NAME_PREFIXES)} ${pickOne(NAME_SUFFIXES[mainCuisine])}`;
  if (random() < 0.4) name = `${name}, ${area}`;

  const seconds = randomSeconds(END_DAY - 730 * DAY_MS, END_DAY - 380 * DAY_MS);

  const doc = {
    _id: makeId(seconds, ID_TAG.restaurant, i),
    name,
    owner: ownerId,
    city: city.name,
    area,
    cuisines,
    location: { type: "Point", coordinates: randomPointNear(city.lat, city.lng) },
    isOpen: i === 0 ? true : random() < 0.9,
    createdAt: new Date(seconds * 1000),
  };

  // Popular restaurants get ~6x the orders. 20% x 6 vs 80% x 1 -> ~60% of all orders.
  const weight = isPopular ? 6 * (0.75 + 0.5 * random()) : 0.5 + random();
  // quality nudges ratings up or down; popular places are a bit better
  const quality = (isPopular ? 0.25 : 0) + (random() * 0.6 - 0.3);
  const priceFactor = 0.85 + random() * 0.45;

  return { doc, cityIndex, seconds, weight, quality, priceFactor };
}

// Returns [{ dish, price, isAvailable, weight }]
function buildMenu(cuisines, priceFactor) {
  const count = randomInt(SETTINGS.minMenuItems, SETTINGS.maxMenuItems);
  const [mainCuisine, ...otherCuisines] = cuisines;

  // ~60% dishes from the main cuisine, the rest from other cuisines and drinks
  const mainDishes = faker.helpers.shuffle(DISHES[mainCuisine]);
  const mainShare = Math.ceil(count * 0.6);
  const rest = faker.helpers.shuffle([
    ...mainDishes.slice(mainShare),
    ...otherCuisines.flatMap((c) => DISHES[c]),
    ...BEVERAGES,
  ]);

  const items = [];
  const usedNames = new Set();
  for (const dish of [...mainDishes.slice(0, mainShare), ...rest]) {
    if (items.length === count) break;
    const [name, category, basePrice] = dish;
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    // Each restaurant is a bit cheaper or costlier. Round to 5, keep within 40-600.
    const price = Math.min(600, Math.max(40, Math.round((basePrice * priceFactor) / 5) * 5));
    // Some dishes are bestsellers, drinks sell less
    const popularity = 0.2 + random() * random() * 3;

    items.push({
      dish,
      price,
      isAvailable: random() < 0.92,
      weight: category === "Beverages" ? popularity * 0.5 : popularity,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seed() {
  const startedAt = Date.now();
  console.log("Settings:", SETTINGS);
  console.log(`Orders between ${new Date(END_DAY - 365 * DAY_MS).toISOString().slice(0, 10)} and ${new Date(END_DAY - DAY_MS).toISOString().slice(0, 10)}`);

  await connectDB();
  await dropCollections();

  // Hash once, reuse for every user (hashing a million times would take hours)
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const userCreatedFrom = END_DAY - 730 * DAY_MS;
  const userCreatedTo = END_DAY - 366 * DAY_MS;

  // ---- Owner ids first (restaurants need them). Owners use user counters 0..owners-1 ----
  const ownerSeconds = new Uint32Array(SETTINGS.owners);
  for (let i = 0; i < SETTINGS.owners; i++) {
    ownerSeconds[i] = randomSeconds(userCreatedFrom, userCreatedTo);
  }
  const ownerId = (i) => makeId(ownerSeconds[i], ID_TAG.user, i);

  // ---- Restaurants + their menus ----
  const restaurantCount = SETTINGS.restaurants;

  // Exactly 20% of restaurants are "popular". Restaurant 0 is the demo (flagship) restaurant.
  const popularCount = Math.max(1, Math.round(restaurantCount * 0.2));
  const isPopular = new Uint8Array(restaurantCount);
  isPopular[0] = 1;
  const others = faker.helpers.shuffle([...Array(restaurantCount).keys()].slice(1));
  for (let k = 0; k < popularCount - 1; k++) isPopular[others[k]] = 1;

  // What we remember about each restaurant (a few bytes each)
  const restaurantCity = new Uint8Array(restaurantCount);
  const restaurantSeconds = new Uint32Array(restaurantCount);
  const restaurantWeight = new Float64Array(restaurantCount);
  const restaurantQuality = new Float32Array(restaurantCount);

  // What we remember about each menu item. Items of restaurant r sit between
  // menuStart[r] and menuStart[r + 1]. menuRunningWeight restarts at 0 for each restaurant.
  const maxMenuItems = restaurantCount * SETTINGS.maxMenuItems;
  const menuStart = new Uint32Array(restaurantCount + 1);
  const menuDish = new Uint16Array(maxMenuItems);
  const menuPrice = new Uint16Array(maxMenuItems);
  const menuRunningWeight = new Float32Array(maxMenuItems);
  let menuCount = 0;

  console.log("\nInserting restaurants and menu items...");
  const restaurantWriter = createBatchWriter(Restaurant, "restaurants", restaurantCount);
  const menuWriter = createBatchWriter(MenuItem, "menu items", restaurantCount * 20);

  for (let i = 0; i < restaurantCount; i++) {
    const r = buildRestaurant(i, isPopular[i] === 1, ownerId(i % SETTINGS.owners));
    restaurantCity[i] = r.cityIndex;
    restaurantSeconds[i] = r.seconds;
    restaurantWeight[i] = r.weight;
    restaurantQuality[i] = r.quality;
    await restaurantWriter.add(r.doc);

    menuStart[i] = menuCount;
    let runningWeight = 0;
    for (const item of buildMenu(r.doc.cuisines, r.priceFactor)) {
      const m = menuCount++;
      const [name, category, , isVeg] = item.dish;
      menuDish[m] = DISH_NUMBER.get(item.dish);
      menuPrice[m] = item.price;
      runningWeight += item.weight;
      menuRunningWeight[m] = runningWeight;

      await menuWriter.add({
        _id: makeId(r.seconds, ID_TAG.menuItem, m),
        restaurant: r.doc._id,
        name,
        category,
        price: item.price,
        isVeg,
        isAvailable: item.isAvailable,
      });
    }
  }
  menuStart[restaurantCount] = menuCount;
  await restaurantWriter.finish();
  await menuWriter.finish();

  // The flagship gets ~0.05% of all restaurant weight, so it is clearly the most popular
  let totalRestaurantWeight = 0;
  for (let i = 1; i < restaurantCount; i++) totalRestaurantWeight += restaurantWeight[i];
  restaurantWeight[0] = Math.max(15, totalRestaurantWeight * 0.0005);

  // ---- Owners ----
  console.log("\nInserting users...");
  const userWriter = createBatchWriter(User, "users", SETTINGS.owners + SETTINGS.customers);
  for (let i = 0; i < SETTINGS.owners; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const isDemo = i === 0;
    await userWriter.add({
      _id: ownerId(i),
      name: isDemo ? "Demo Owner" : `${firstName} ${lastName}`,
      email: isDemo ? DEMO_OWNER_EMAIL : makeEmail(firstName, lastName, i),
      password: passwordHash,
      role: "owner",
      // An owner lives in the city of their first restaurant
      city: CITIES[i < restaurantCount ? restaurantCity[i] : pickCity()].name,
      refreshToken: null,
      createdAt: new Date(ownerSeconds[i] * 1000),
    });
  }

  // ---- Customers. They use user counters owners..owners+customers-1 ----
  const customerSeconds = new Uint32Array(SETTINGS.customers);
  const customerCity = new Uint8Array(SETTINGS.customers);
  const customerWeight = new Float64Array(SETTINGS.customers);
  const customerId = (c) => makeId(customerSeconds[c], ID_TAG.user, SETTINGS.owners + c);

  for (let c = 0; c < SETTINGS.customers; c++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const isDemo = c === 0;
    customerSeconds[c] = randomSeconds(userCreatedFrom, userCreatedTo);
    customerCity[c] = isDemo ? DEMO_CITY_INDEX : pickCity();
    // A few customers order a lot, most order now and then
    customerWeight[c] = 1 / (0.05 + random());

    await userWriter.add({
      _id: customerId(c),
      name: isDemo ? "Demo Customer" : `${firstName} ${lastName}`,
      email: isDemo ? DEMO_CUSTOMER_EMAIL : makeEmail(firstName, lastName, SETTINGS.owners + c),
      password: passwordHash,
      role: "customer",
      city: CITIES[customerCity[c]].name,
      refreshToken: null,
      createdAt: new Date(customerSeconds[c] * 1000),
    });
  }
  await userWriter.finish();

  // The demo customer is a regular: about 0.005% of all customer weight
  let totalCustomerWeight = 0;
  for (let c = 1; c < SETTINGS.customers; c++) totalCustomerWeight += customerWeight[c];
  customerWeight[0] = Math.max(20, totalCustomerWeight * 0.00005);

  // ---- Pickers for orders ----
  const pickCustomer = weightedPicker(customerWeight);
  const pickAnyRestaurant = weightedPicker(restaurantWeight);

  const restaurantsByCity = CITIES.map(() => []);
  for (let i = 0; i < restaurantCount; i++) restaurantsByCity[restaurantCity[i]].push(i);
  const localPickers = restaurantsByCity.map((indexes) =>
    indexes.length > 0 ? weightedPicker(indexes.map((i) => restaurantWeight[i])) : null
  );

  // Customers order from their own city 85% of the time
  function pickRestaurantIndex(cityIndex) {
    const pickLocal = localPickers[cityIndex];
    if (pickLocal && random() < 0.85) return restaurantsByCity[cityIndex][pickLocal()];
    return pickAnyRestaurant();
  }

  function pickMenuItem(restaurantIndex) {
    const first = menuStart[restaurantIndex];
    const last = menuStart[restaurantIndex + 1] - 1;
    return firstAbove(menuRunningWeight, random() * menuRunningWeight[last], first, last);
  }

  // ---- Orders + reviews (built and inserted batch by batch) ----
  console.log("\nInserting orders and reviews...");
  const orderWriter = createBatchWriter(Order, "orders", SETTINGS.orders);
  const reviewWriter = createBatchWriter(Review, "reviews", SETTINGS.reviews);
  const orderCounts = new Uint32Array(restaurantCount);
  let reviewsCreated = 0;

  for (let i = 0; i < SETTINGS.orders; i++) {
    const c = pickCustomer();
    const r = pickRestaurantIndex(customerCity[c]);
    const createdAt = randomOrderDate();

    // 1 to 4 different dishes from this restaurant's menu
    const menuSize = menuStart[r + 1] - menuStart[r];
    const itemCount = Math.min(pickItemCount() + 1, menuSize);
    const usedItems = new Set();
    const items = [];
    let totalAmount = 0;
    while (items.length < itemCount) {
      const m = pickMenuItem(r);
      if (usedItems.has(m)) continue;
      usedItems.add(m);

      const quantity = pickQuantity() + 1;
      const price = menuPrice[m];
      items.push({
        menuItem: makeId(restaurantSeconds[r], ID_TAG.menuItem, m),
        name: ALL_DISHES[menuDish[m]][0],
        price,
        quantity,
      });
      totalAmount += price * quantity;
    }

    const order = {
      _id: makeId(Math.floor(createdAt.getTime() / 1000), ID_TAG.order, i),
      customer: customerId(c),
      restaurant: makeId(restaurantSeconds[r], ID_TAG.restaurant, r),
      items,
      totalAmount,
      status: STATUSES[pickStatus()],
      paymentMethod: PAYMENT_METHODS[pickPayment()],
      createdAt,
    };
    await orderWriter.add(order);
    orderCounts[r]++;

    // Spread reviews evenly over all delivered orders until we reach REVIEW_COUNT
    const reviewsLeft = SETTINGS.reviews - reviewsCreated;
    if (order.status === "delivered" && reviewsLeft > 0) {
      const deliveredOrdersLeft = (SETTINGS.orders - i) * 0.85;
      if (random() < reviewsLeft / deliveredOrdersLeft) {
        const rating = pickRating(restaurantQuality[r]);
        // Review is written 1 to 48 hours after ordering
        const reviewMs = Math.min(createdAt.getTime() + randomInt(1, 48) * 3600 * 1000, END_DAY);

        await reviewWriter.add({
          _id: makeId(Math.floor(reviewMs / 1000), ID_TAG.review, reviewsCreated),
          customer: order.customer,
          restaurant: order.restaurant,
          order: order._id,
          rating,
          comment: random() < 0.15 ? "" : pickOne(REVIEW_COMMENTS[rating]),
          createdAt: new Date(reviewMs),
        });
        reviewsCreated++;
      }
    }
  }
  await orderWriter.finish();
  await reviewWriter.finish();

  // ---- Make sure owner@foodhub.com owns the most popular restaurant ----
  let topIndex = 0;
  for (let i = 1; i < restaurantCount; i++) {
    if (orderCounts[i] > orderCounts[topIndex]) topIndex = i;
  }
  const topOwnerIndex = topIndex % SETTINGS.owners;
  if (topOwnerIndex !== 0) {
    // Swap name and email between the demo owner and the real top owner
    const demoOwner = await User.collection.findOne({ _id: ownerId(0) });
    const topOwner = await User.collection.findOne({ _id: ownerId(topOwnerIndex) });
    await User.collection.updateOne({ _id: demoOwner._id }, { $set: { name: topOwner.name, email: topOwner.email } });
    await User.collection.updateOne({ _id: topOwner._id }, { $set: { name: demoOwner.name, email: demoOwner.email } });
  }
  const demoRestaurant = await Restaurant.collection.findOne({
    _id: makeId(restaurantSeconds[topIndex], ID_TAG.restaurant, topIndex),
  });
  // Owner k owns restaurants k, k + owners, k + 2 * owners, ...
  const demoOwnerRestaurants = Math.floor((restaurantCount - 1 - topOwnerIndex) / SETTINGS.owners) + 1;

  // ---- Summary ----
  const sortedCounts = Uint32Array.from(orderCounts).sort(); // ascending
  let top20Orders = 0;
  for (let k = 0; k < Math.round(restaurantCount * 0.2); k++) top20Orders += sortedCounts[restaurantCount - 1 - k];

  // estimatedDocumentCount reads collection metadata, so it is instant even for millions
  const [userCount, restaurantTotal, menuItemCount, orderCount, reviewCount] = await Promise.all(
    MODELS.map((Model) => Model.collection.estimatedDocumentCount())
  );
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log("\n========== SEED COMPLETE ==========");
  console.log(`Users:        ${format(userCount)}`);
  console.log(`Restaurants:  ${format(restaurantTotal)}`);
  console.log(`Menu items:   ${format(menuItemCount)}`);
  console.log(`Orders:       ${format(orderCount)}`);
  console.log(`Reviews:      ${format(reviewCount)}`);
  console.log(`Top 20% of restaurants got ${((top20Orders / SETTINGS.orders) * 100).toFixed(1)}% of orders`);
  console.log(`Total time:   ${seconds}s`);
  console.log("\nDemo accounts (password: password123)");
  console.log(`  Owner:    ${DEMO_OWNER_EMAIL} (owns ${demoOwnerRestaurants} restaurant${demoOwnerRestaurants > 1 ? "s" : ""})`);
  console.log(`  Customer: ${DEMO_CUSTOMER_EMAIL}`);
  console.log(`\nDemo restaurant (most popular): ${demoRestaurant.name}, ${demoRestaurant.area}, ${demoRestaurant.city}`);
  console.log(`  _id:    ${demoRestaurant._id}`);
  console.log(`  orders: ${format(orderCounts[topIndex])}`);
}

seed()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  });
