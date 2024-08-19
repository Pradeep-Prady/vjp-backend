import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import cookieParser from "cookie-parser";
import categoryRoute from "./src/route/category.js";
import userRoute from "./src/route/user.js";
import itemRoute from "./src/route/item.js";
import adminRoute from "./src/route/admin.js";
import orderRoute from "./src/route/order.js";

import globalResponseController from "./src/utils/response-handlers/global-response-controller.js";
import verifyUserRoute from "./src/route/verifyUser.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "https://vjpenterprises.in",
  "http://vjpenterprises.in",
  "https://www.vjpenterprises.in",
  "http://www.vjpenterprises.in",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://localhost:7000",
  "http://127.0.0.1:7000",
  "https://vjp.vercel.app",
  "https://vjp.vercel.app/"
];
app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/src/uploads", express.static(path.join(__dirname, "src/uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/v1", categoryRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", itemRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1", orderRoute);
app.use("/api/v1", verifyUserRoute);

// if (process.env.NODE_ENV === "prod") {

app.use(express.static(path.join(__dirname, "./dist")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./dist/index.html"));
});

// }

app.use(globalResponseController);

export default app;
