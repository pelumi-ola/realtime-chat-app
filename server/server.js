import "dotenv/config";

import http from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import { registerChatSocket } from "./sockets/chatSocket.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);
// Register Socket.IO event handlers
registerChatSocket(io);

// Connect to MongoDB, then start the server
async function startServer() {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
