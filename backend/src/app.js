import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import connectToSocket from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";

const app = express(); //Express app banaya
const server = createServer(app); //Express ko HTTP server me convert kiya then
//usko Socket.io ke sath use kiya
const io = connectToSocket(server);


app.set("port", process.env.PORT || 8000);
app.use(cors({
  origin: "*", // Allow all origins for network access (or use specific frontend URL for production)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "40kb"}));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);


app.get("/home", (req, res) => {
  return res.json({ Hello: "world" });
});

const start = async () => {
  app.set("mongo_user");
  const connectionDB = await mongoose.connect(
    "mongodb+srv://MeetHub5:MeetHub15@cluster0.zcm0uhw.mongodb.net/?appName=Cluster0"
  );
  console.log(`MONGO Cnneted DB Host:${connectionDB.connection.host}`)
  server.listen(app.get("port"), () => {
    console.log("LISTENING on Port 8000");
  });
};

start();
