import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock mongoose so server.js health route uses the stubbed connection
vi.mock('mongoose', () => {
	const mockConn = {
		readyState: 1,
		db: {
			databaseName: 'technova',
			admin: () => ({
				ping: async () => ({ ok: 1 }),
			}),
		},
	};
	return {
		default: { connection: mockConn },
		connection: mockConn,
	};
});

// Import after mocks are in place
import { app } from '../server.js';

describe('GET /health/db', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('returns ok: true when connected and ping succeeds', async () => {
		const res = await request(app).get('/health/db').expect(200);
		expect(res.body).toMatchObject({
			ok: true,
			driver: 'mongoose',
			state: 1,
			db: 'technova',
			ping: 1,
		});
	});
});
