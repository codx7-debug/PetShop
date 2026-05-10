import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import authApiRoutes from "./routes/authApi.routes.js";
import adminApiRoutes from "./routes/adminApi.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import reportApiRoutes from "./routes/reportApi.routes.js";
import orgPortalRoutes from "./routes/orgPortal.routes.js";
import userPortalRoutes from "./routes/userPortal.routes.js";
import accounterPortalRoutes from "./routes/accounterPortal.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT version()");
    res.json({ success: true, message: "Connected to the database.", version: result.rows[0].version });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    res.status(500).json({ success: false, error: "Failed to connect to the database." });
  }
});

app.use("/api", appointmentRoutes);
app.use("/api", userPortalRoutes);
app.use("/api", catalogRoutes);
app.use("/api", reportApiRoutes);
app.use("/api/org", orgPortalRoutes);
app.use("/api/auth", authApiRoutes);
app.use("/api/admin", adminApiRoutes);
app.use("/api/accounter", accounterPortalRoutes);

export default app;