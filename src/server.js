import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/conectDB.js";
import viewEngine from "./config/viewEngine.js";
import initWebRoutes from "./route/web.js";
import cronService from "./services/cronService.js";
import initSocketServer from "./services/socketService.js";

dotenv.config();

let app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, replace with specific origins
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true,
  },
});

viewEngine(app);
app.use(cors({ origin: true }));

// Use express built-in body parsing (more modern than body-parser)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

// Initialize web routes and socket server
initWebRoutes(app);
initSocketServer(io);

connectDB();

// Khởi động cron service cho automated notifications
cronService.start();

const port = process.env.PORT || 8080;
httpServer.listen(port, () => {
  console.log(`🚀 Backend Nodejs is running on port: ${port}`);
  console.log(`🔌 Socket.IO server is active`);
  console.log(`📅 Automated reminder system is active`);
  console.log(`⏰ Maintenance reminders: Daily at 9:00 AM`);
  console.log(`⏰ Package renewal reminders: Daily at 10:00 AM`);
  console.log(`⏰ Weekly maintenance check: Sundays at 8:00 AM`);
});
