import 'dotenv/config';
import mongoose from "mongoose";
import express from "express";
import cors from "cors";

// ensure `app` is exported for tests
export const app = express();
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

// Add DB health endpoint
app.get('/health/db', async (_req, res) => {
	// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
	const state = mongoose.connection?.readyState ?? 0;
	let ping = 0;
	let dbName = null;

	try {
		if (state === 1 && mongoose.connection.db) {
			dbName = mongoose.connection.db.databaseName ?? null;
			const admin = mongoose.connection.db.admin();
			const pong = await admin.ping().catch(() => ({ ok: 0 }));
			ping = pong?.ok === 1 ? 1 : 0;
		}
	} catch {
		ping = 0;
	}

	res.status(200).json({
		ok: state === 1 && ping === 1,
		driver: 'mongoose',
		state,
		db: dbName,
		ping,
	});
});

// Start server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
