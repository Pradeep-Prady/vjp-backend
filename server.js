import "./src/config/index.js";
import connectDatabase from "./database.js";
import app from "./app.js";

import globalResponseController from "./src/utils/response-handlers/global-response-controller.js";

const DB_URL = process.env.DATABASE_URI;

connectDatabase(DB_URL);

const port = process.env.PORT || 3004;

const server = app.listen(port, () => {
  console.log(
    "VJP API " +
      process.env.NODE_ENV +
      " mode on PORT " +
      process.env.PORT +
      " " +
      new Date()
  );
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection", err);
  server.close(() => {
    process.exit(1);
  });
});
