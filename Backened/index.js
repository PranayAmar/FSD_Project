import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "node:http"; //connects our server with socket.io server
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/userRoutes.js";
import passport from "passport";
import session from "express-session";
import "./config/passport.js";
import authRoute from "./routes/authRoute.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 5000);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/users", userRoutes);
app.use("/auth", authRoute);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to database");

    server.listen(app.get("port"), () => {
      console.log(`server is running on port ${app.get("port")}`);
    });
  })
  .catch((error) => {
    console.error("Connection failed with error as:", error.message);
  });
