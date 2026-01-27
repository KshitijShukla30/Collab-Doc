import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from './ws/handler.js';
import { connectDB } from './db/models.js';
import documentsRouter from './routes/documents.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/documents', documentsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    // Extract document name from URL path
    const url = new URL(req.url, `http://${req.headers.host}`);
    const docName = url.pathname.slice(1) || 'default';

    console.log(`Client connected to document: ${docName}`);

    setupWSConnection(ws, docName);
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket ready for connections`);
});
