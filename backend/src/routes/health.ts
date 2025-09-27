import { Router } from 'express';

const router = Router();

/**
 * GET /health/db
 * Returns:
 *  - ok: boolean
 *  - driver: 'mongoose' if detected, else 'none'
 *  - state: 0..3 (mongoose connection state) or 0 if unavailable
 *  - db: current database name or null
 *  - ping: 1 if admin ping succeeded, else 0
 */
router.get('/db', async (_req, res) => {
	let driver: 'mongoose' | 'none' = 'none';
	let state = 0; // 0=disconnected
	let ping = 0;
	let dbName: string | null = null;

	try {
		// Dynamically import mongoose if present
		const mod = await import('mongoose').catch(() => null);
		const mongoose: any = mod ? (mod as any).default ?? mod : null;

		if (mongoose?.connection) {
			driver = 'mongoose';
			state = mongoose.connection?.readyState ?? 0;

			if (state === 1 && mongoose.connection.db) {
				dbName = mongoose.connection.db.databaseName ?? null;
				const admin = mongoose.connection.db.admin();
				const pong = await admin.ping().catch(() => ({ ok: 0 as const }));
				ping = pong?.ok === 1 ? 1 : 0;
			}
		}
	} catch {
		// ignore
	}

	return res.status(200).json({
		ok: state === 1 && ping === 1,
		driver,
		state,
		db: dbName,
		ping,
	});
});

export default router;
