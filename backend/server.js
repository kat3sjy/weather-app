// Load env from backend/.env and root .env
import dotenv from 'dotenv';
dotenv.config({ path: new URL('./.env', import.meta.url).pathname }); // backend/.env (explicit)
dotenv.config({ path: new URL('../.env', import.meta.url).pathname }); // repo root .env

import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import chatRouter from './chat/router.js';
import { chatStore } from './chat/store.js';
// import { hasGeminiKey, analyzeText, GEMINI_MODEL } from './ai/gemini.js'; // removed; will dynamic-import after env

// ensure `app` is exported for tests
export const app = express();
app.use(express.json());

// CORS (allow specific origin if provided)
const rawOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = rawOrigins.length ? rawOrigins : ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
console.log('[startup] CORS allowed origins:', allowedOrigins);

// Load AI utils after env is configured
const { hasGeminiKey, analyzeText, getGeminiModel } = await import('./ai/gemini.js');
console.log('[startup] AI config:', { model: getGeminiModel(), hasKey: hasGeminiKey() });

// MongoDB connection (optional in dev)
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI; // fixed typo
if (mongoUri) {
  mongoose
    .connect(mongoUri, { dbName: process.env.MONGODB_DB || 'technova' })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.error("MongoDB connection error:", err?.message || err);
      // Do not exit; allow chat-only mode to continue
    });
} else {
  console.warn("No MONGODB_URI set. Skipping MongoDB connection (dev chat mode).");
}

// Routes
import profileRoutes from "./routes/profile.js";
import legacyMatchesRoutes from "./routes/matches.js";
import messageRoutes from "./routes/messages.js";
import matchRoutes from './routes/matchRoutes.js';

app.use("/api/profile", profileRoutes);
app.use("/api/matches", legacyMatchesRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api', matchRoutes);

// Mount chat HTTP routes
app.use('/api/chat', chatRouter);

// --- AI demo endpoints ---
app.get('/api/ai/status', (_req, res) => {
  res.json({
    ok: hasGeminiKey(),
    service: 'gemini',
    model: getGeminiModel(),
    status: hasGeminiKey() ? 'ready' : 'missing-api-key',
  });
});

// Analyze text with Gemini
app.post('/api/ai/analyze', async (req, res) => {
  try {
    if (!hasGeminiKey()) {
      return res.status(503).json({ ok: false, error: 'missing-api-key' });
    }
    const { text, model } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ ok: false, error: 'invalid-text' });
    }
    const usedModel = (model && String(model).trim()) || getGeminiModel();
    const reply = await analyzeText(text, { model: usedModel });
    res.json({ ok: true, model: usedModel, text: reply });
  } catch (err) {
    console.error('[ai] analyze error:', err);
    res.status(500).json({ ok: false, error: 'ai-analyze-failed' });
  }
});

// --- HTTP server + Socket.IO wiring ---
const httpServer = http.createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

io.on('connection', (socket) => {
  console.log('[socket] connected:', socket.id);

  socket.on('join', (roomId) => {
    if (roomId) {
      socket.join(roomId);
      socket.emit('joined', roomId);
    }
  });

  socket.on('chat:send', async ({ roomId, message }) => {
    try {
      if (!roomId || !message) return;
      // Persist if store supports it (optional)
      try {
        await chatStore.addMessage?.(roomId, message);
      } catch (_) {
        // ignore optional persistence errors in dev
      }
      io.to(roomId).emit('chat:message', message);
    } catch (e) {
      console.error('[socket] chat:send error', e);
    }
  });

  socket.on('disconnect', () => {
    // no-op
  });
});

// Start server with retry if port is busy
const HOST = process.env.HOST || '0.0.0.0';
const BASE_PORT = Number(process.env.PORT) || 5000;

function listenWithRetry(port, retries = 10) {
  return new Promise((resolve, reject) => {
    httpServer
      .once('listening', () => {
        console.log(`[startup] Server listening on http://${HOST}:${port}`);
        resolve(port);
      })
      .once('error', (err) => {
        if (err?.code === 'EADDRINUSE' && retries > 0) {
          console.warn(`[startup] Port ${port} in use, trying ${port + 1}`);
          // remove listeners before retry
          httpServer.removeAllListeners('listening');
          httpServer.removeAllListeners('error');
          setTimeout(() => {
            httpServer.listen(port + 1, HOST);
            listenWithRetry(port + 1, retries - 1).then(resolve).catch(reject);
          }, 100);
        } else {
          console.error('[startup] Server listen error:', err);
          reject(err);
        }
      });

    httpServer.listen(port, HOST);
  });
}

try {
  await listenWithRetry(BASE_PORT);
} catch {
  process.exit(1);
}

// Global error logging (do not crash in dev)
process.on('unhandledRejection', (err) => {
  console.error('[process] UnhandledRejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('[process] UncaughtException:', err);
});
