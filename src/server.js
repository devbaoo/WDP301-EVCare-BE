import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/conectDB.js";
import viewEngine from "./config/viewEngine.js";
import initWebRoutes from "./route/web.js";
import cronService from "./services/cronService.js";

dotenv.config();

let app = express();

viewEngine(app);
app.use(cors({ origin: true }));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

initWebRoutes(app);

connectDB();

// Khởi động cron service cho automated notifications
cronService.start();

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`🚀 Backend Nodejs is running on port: ${port}`);
    console.log(`📅 Automated reminder system is active`);
    console.log(`⏰ Maintenance reminders: Daily at 9:00 AM`);
    console.log(`⏰ Package renewal reminders: Daily at 10:00 AM`);
    console.log(`⏰ Weekly maintenance check: Sundays at 8:00 AM`);
});
