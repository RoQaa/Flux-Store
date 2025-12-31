const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const app = require("./app");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// Load environment variables
dotenv.config({ path: `${__dirname}/config.env` });

// Connect to MongoDB
const DB = process.env.DATABASE.replace('<db_password>',process.env.PASSWORD);
mongoose.set("strictQuery", true);
mongoose
  .connect(DB)
  .then(() => {
    console.log("✅ DB connection successful");
  });

// Create HTTP server
const server = http.createServer(app);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
