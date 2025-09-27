import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

// CORS (allow specific origin if provided)
const corsOrigin = process.env.FRONTEND_ORIGIN || "*";
app.use(cors({ origin: corsOrigin }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { dbName: "pixelpal" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err?.message || err);
    process.exit(1);
  });

// Routes
import profileRoutes from "./routes/profile.js";
import matchRoutes from "./routes/matches.js";
import messageRoutes from "./routes/messages.js";

app.use("/api/profile", profileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);

// Health
app.get("/", (_req, res) => res.send("API is running"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
