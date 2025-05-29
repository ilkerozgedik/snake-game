// server.ts
import express from "express";
import http from "http";
import path from "path"; // Added
import { Server as SocketIOServer } from "socket.io";
import { initializeSocketHandlers } from "./socketHandlers";
import {
  players,
  pellets,
  handlePlayerPelletCollision,
  handlePlayerVsPlayerCollisions,
  initializePellets,
} from "./gameLogic";

const app = express();

// Path to the client's build directory
// This path assumes server.ts is in server/dist/src/server.js after build
const clientBuildPath = path.join(__dirname, '../../../../my-canvas-game/dist'); 
// Adjusted path: from server/dist/src/server.js up to root (server/dist/src -> server/dist -> server -> .), then my-canvas-game/dist

// Serve static files from the client's build directory
app.use(express.static(clientBuildPath));


const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:5173', // Allow Vite dev server in dev
    methods: ["GET", "POST"],
  },
});

// Initialize pellets at server start
initializePellets();

// Initialize socket event handlers
initializeSocketHandlers(io);

// For any other GET request, serve the client's index.html (must be after static files)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Main Game Loop
setInterval(() => {
  // Update game state based on collisions and other logic
  players.forEach((player) => {
    handlePlayerPelletCollision(player.id);
  });

  handlePlayerVsPlayerCollisions(io); // Pass io to emit events directly

  // Broadcast the updated game state to all clients
  io.emit("gameStateUpdate", {
    players: Object.fromEntries(players),
    pellets: Object.fromEntries(pellets),
  });
}, 30); // Approx 33 times/sec, ~30ms interval

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
