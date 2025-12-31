const dotenv = require("dotenv");
const http = require("http");
const app = require("./app");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: `${__dirname}/config.env` });
}

if (process.env.NODE_ENV === "development") {
  const server = http.createServer(app);
  server.listen(5000, () => {
    console.log("🚀 Local server running");
  });
}

module.exports = app;
