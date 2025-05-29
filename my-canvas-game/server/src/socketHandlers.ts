// socketHandlers.ts
import { Server, Socket } from "socket.io";
import {
  players,
  pellets,
  Player,
  createNewPlayer,
  respawnPlayer,
  updatePlayerPosition,
  initializePellets, // Assuming you want to re-initialize pellets if all players leave and a new one joins, or on server start
} from "./gameLogic";

// Basic input validation
function isValidName(name: string): boolean {
  return typeof name === "string" && name.length > 0 && name.length < 30;
}

export function initializeSocketHandlers(io: Server) {
  if (pellets.size === 0) {
    // Initialize pellets if they are not already there
    initializePellets();
  }

  io.on("connection", (socket: Socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("requestJoin", (data: { name: string }) => {
      const playerName = isValidName(data.name)
        ? data.name
        : `Player_${socket.id.substring(0, 4)}`;
      console.log(`Player ${socket.id} requests to join as ${playerName}`);

      const newPlayer = createNewPlayer(socket.id, playerName);
      players.set(socket.id, newPlayer);

      socket.emit("initialize", {
        id: socket.id,
        player: newPlayer,
        allPlayers: Object.fromEntries(players),
        pellets: Object.fromEntries(pellets),
      });

      socket.broadcast.emit("playerJoined", newPlayer);
    });

    socket.on("playerStateUpdate", (data: { x: number; y: number }) => {
      // Basic validation for position data
      if (typeof data.x !== "number" || typeof data.y !== "number") {
        console.warn(
          `Invalid playerStateUpdate from ${socket.id}: x or y is not a number.`,
        );
        return;
      }
      updatePlayerPosition(socket.id, data.x, data.y);
    });

    socket.on("requestRespawn", (data: { name?: string }) => {
      let player = players.get(socket.id);
      const respawnName =
        data.name && isValidName(data.name)
          ? data.name
          : player
            ? player.name
            : `Player_${socket.id.substring(0, 4)}`;

      if (player) {
        player = respawnPlayer(player, respawnName);
      } else {
        // If player doesn't exist (e.g., was disconnected and record deleted), create anew
        player = createNewPlayer(socket.id, respawnName);
        players.set(socket.id, player);
      }

      socket.emit("initialize", {
        // Re-initialize the client
        id: socket.id,
        player: player,
        allPlayers: Object.fromEntries(players),
        pellets: Object.fromEntries(pellets),
      });
      io.emit("playerRespawned", player);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      players.delete(socket.id);
      io.emit("playerLeft", socket.id);
      // Optional: if (players.size === 0) initializePellets(); // Re-initialize if server is empty
    });
  });
}
