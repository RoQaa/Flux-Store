const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const app = require("./app");

let server; // ⭐ حل مشكلة scope

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION 💥", err.name, err.message);
  process.exit(1);
});

// Load env only in local
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: `${__dirname}/config.env` });
}

// Connect to MongoDB
const DB = process.env.DATABASE.replace(
  "<db_password>",
  process.env.PASSWORD
);

mongoose.set("strictQuery", true);

mongoose
  .connect(DB, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log("✅ DB connection successful");
  });

// Start server only in development
if (process.env.NODE_ENV === "development") {
  server = http.createServer(app);

  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION 💥", err.name, err.message);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

module.exports = app; // ⭐ مهم لـ Vercel
