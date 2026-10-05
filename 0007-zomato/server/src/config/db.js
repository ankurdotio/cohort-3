const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  const uri = env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set. Copy .env.example to .env first.");
  }

  // autoIndex: false -> Mongoose will NOT build any indexes for us.
  // Creating the right indexes is your job later in the course.
  await mongoose.connect(uri, { autoIndex: false });

  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

module.exports = connectDB;
