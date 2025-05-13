require("dotenv").config();
require("./db"); // connect to MongoDB

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");

const authRoutes = require("./auth");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use(express.static("client")); // serves index.html

// WebSocket handling
wss.on("connection", (ws, req) => {
  console.log("🔌 WebSocket client trying to connect");

  // Step 1: Wait for token from client
  ws.on("message", async (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (err) {
      return ws.send("Invalid message format");
    }

    if (msg.type === "auth") {
      try {
        const payload = jwt.verify(msg.token, JWT_SECRET);
        ws.username = payload.username;
        console.log("✅ Authenticated:", ws.username);
        ws.send(
          JSON.stringify({ type: "auth-success", username: ws.username })
        );

        // Send last 10 messages
        const recentMessages = await Message.find()
          .sort({ timestamp: -1 })
          .limit(10);
        ws.send(
          JSON.stringify({
            type: "history",
            messages: recentMessages.reverse(),
          })
        );
      } catch (err) {
        return ws.send(JSON.stringify({ type: "auth-failed" }));
      }
    }

    if (msg.type === "message") {
      if (!ws.username) {
        return ws.send(JSON.stringify({ type: "error", text: "Unauthorized" }));
      }

      const messageData = {
        sender: ws.username,
        text: msg.text,
      };

      // Save to DB
      const newMsg = new Message(messageData);
      await newMsg.save();

      // Broadcast to all clients
      const payload = JSON.stringify({
        type: "message",
        sender: ws.username,
        text: msg.text,
        timestamp: newMsg.timestamp,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
