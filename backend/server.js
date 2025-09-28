import 'dotenv/config';
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import chatRouter from './chat/router.js';
import { chatStore } from './chat/store.js';
import compatRouter from './routes/compatibility.js';

// ensure `app` is exported for tests
export const app = express();
app.use(express.json());

// CORS (allow specific origin if provided)
const rawOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = rawOrigins.length ? rawOrigins : ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// MongoDB connection (optional in dev)
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
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

// Mount compatibility router
app.use(compatRouter);

// --- AI demo endpoints ---
app.get('/api/ai/status', (req, res) => {
  res.json({ ok: true, service: 'ai', status: 'ready' });
});

app.post('/api/ai/analyze', async (req, res) => {
  const { text } = req.body || {};
  // Stubbed response; replace with real logic as needed.
  res.json({
    ok: true,
    inputLength: typeof text === 'string' ? text.length : 0,
    result: 'analysis-complete',
  });
});
// --- end AI endpoints ---

// Health
app.get("/", (_req, res) => res.send("API is running"));

// Add DB health endpoint
app.get('/health/db', async (_req, res) => {
  const hasUri = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const state = mongoose.connection?.readyState ?? 0;
  let ping = 0;
  let dbName = null;

  try {
    if (hasUri && state === 1 && mongoose.connection.db) {
      dbName = mongoose.connection.db.databaseName ?? null;
      const admin = mongoose.connection.db.admin();
      const pong = await admin.ping().catch(() => ({ ok: 0 }));
      ping = pong?.ok === 1 ? 1 : 0;
    }
  } catch {
    ping = 0;
  }

  res.status(200).json({
    ok: hasUri ? (state === 1 && ping === 1) : false,
    driver: hasUri ? 'mongoose' : 'none',
    state: hasUri ? state : 0,
    db: hasUri ? dbName : null,
    ping: hasUri ? ping : 0,
  });
});

// Dev portal showing both UIs on one port (3000)
app.get('/dev', (_req, res) => {
  const rootUrl = 'http://localhost:5174';   // root UI
  const chatUrl = 'http://localhost:5173';   // frontend/chat UI
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Technova Dev Portal</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0b0f16; color: #e5e7eb; }
    header { padding: 12px 16px; border-bottom: 1px solid #1f2937; display:flex; gap:16px; align-items:center; }
    a { color: #93c5fd; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; height: calc(100vh - 52px); }
    .pane { display:flex; flex-direction:column; }
    .pane header { border-bottom: 1px solid #1f2937; }
    iframe { flex: 1; border: 0; background: #111827; }
  </style>
</head>
<body>
  <header>
    <strong>Technova Dev Portal</strong>
    <span>API: <code>http://localhost:3000</code></span>
    <span>Root UI: <a href="${rootUrl}" target="_blank" rel="noreferrer">${rootUrl}</a></span>
    <span>Chat UI: <a href="${chatUrl}" target="_blank" rel="noreferrer">${chatUrl}</a></span>
  </header>
  <div class="grid">
    <div class="pane">
      <header style="padding:8px 12px;">Root UI (5174)</header>
      <iframe src="${rootUrl}"></iframe>
    </div>
    <div class="pane">
      <header style="padding:8px 12px;">Chat UI (5173)</header>
      <iframe src="${chatUrl}"></iframe>
    </div>
  </div>
</body>
</html>`);
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Replace app.listen with an HTTP server + Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Socket.IO events
io.on('connection', (socket) => {
  // Join a conversation room
  socket.on('conversation:join', ({ conversationId, userId }) => {
    if (!conversationId) return;
    try {
      if (userId) {
        // add the socket's user to the conversation so it appears in their list
        chatStore.addParticipant(conversationId, userId);
      }
    } catch {}
    socket.join(`c:${conversationId}`);
  });

  // Send a message
  socket.on('message:send', (payload, cb) => {
    try {
      const { conversationId, senderId, text } = payload || {};
      const msg = chatStore.addMessage({ conversationId, senderId, text });
      io.to(`c:${conversationId}`).emit('message:new', msg);
      cb && cb({ ok: true, message: msg });
    } catch {
      cb && cb({ ok: false, error: 'Conversation not found' });
    }
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    if (!conversationId || !userId) return;
    socket.to(`c:${conversationId}`).emit('typing', { conversationId, userId, isTyping: !!isTyping });
  });
});

server.on('error', (err) => {
  console.error('HTTP server error:', err?.message || err);
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, HOST, () => {
    const urlHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Server with Socket.IO listening on http://${urlHost}:${PORT} (bind: ${HOST})`);
    console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  });
}
