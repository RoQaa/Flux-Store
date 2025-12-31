const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const DB = process.env.DATABASE.replace(
      "<db_password>",
      process.env.PASSWORD
    );

    cached.promise = mongoose.connect(DB, {
      bufferCommands: false, // ⭐ مهم
      serverSelectionTimeoutMS: 30000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
