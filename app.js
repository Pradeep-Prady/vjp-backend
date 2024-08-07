import "./src/config/index.js";

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
import connectDatabase from "./database.js";

import globalResponseController from "./src/utils/response-handlers/global-response-controller.js";
import verifyUserRoute from "./src/route/verifyUser.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// server connect

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

// process.on("unhandledRejection", (err) => {
//   console.error("Unhandled Rejection", err);
//   server.close(() => {
//     process.exit(1);
//   });
// });

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
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// Handle preflight requests

app.options("*", cors());

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg =
//           "The CORS policy for this site does not allow access from the specified origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     allowedHeaders: ["Content-Type", "Authorization"],
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   })
// );

// app.use(
//   cors({
//     origin: "*", // Allow all origins
//     credentials: true, // Allow credentials (cookies, authorization headers, etc.)
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed methods
//   })
// );

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

console.log(__dirname, "__dirname");

app.use(express.static(path.join(__dirname, "/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "/dist/index.html"));
});

app.use(globalResponseController);

export default app;

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { fileURLToPath } from 'url';
// import path from 'path';
// import cookieParser from 'cookie-parser';
// import categoryRoute from './src/route/category.js';
// import userRoute from './src/route/user.js';
// import itemRoute from './src/route/item.js';
// import adminRoute from './src/route/admin.js';
// import orderRoute from './src/route/order.js';
// import connectDatabase from './database.js';
// import globalResponseController from './src/utils/response-handlers/global-response-controller.js';
// import verifyUserRoute from './src/route/verifyUser.js';

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://localhost:8002',
//   'https://vjp.onrender.com',
//   'https://aejsinfo.com',
//   'http://aejsinfo.com',
//   'http://127.0.0.1:5173',
// ];

// app.use(cookieParser());

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//         callback(null, true);
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     credentials: true,
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use('/src/uploads', express.static(path.join(__dirname, 'src/uploads')));
// app.use('/public', express.static(path.join(__dirname, 'public')));

// app.use('/api/v1', categoryRoute);
// app.use('/api/v1', userRoute);
// app.use('/api/v1', itemRoute);
// app.use('/api/v1/admin', adminRoute);
// app.use('/api/v1', orderRoute);
// app.use('/api/v1', verifyUserRoute);

// // Assuming dist folder for frontend
// app.use(express.static(path.join(__dirname, './dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, './dist', 'index.html'));
// });

// app.use(globalResponseController);

// export default app;
