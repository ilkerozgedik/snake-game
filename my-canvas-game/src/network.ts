// network.ts
import { io, Socket } from "socket.io-client";
import {
  localPlayer,
  updateLocalPlayer,
  updateOtherPlayers,
  updatePellets,
  setGameOver,
  // PlayerData, // Will be imported as type
  // Pellet, // Will be imported as type
  resetGameState,
  setAnimationFrameId,
} from "./clientGame";
import {
  showMainMenu,
  showGameUI,
  showGameOverUI,
  updateLeaderboard,
} from "./ui";
import type { PlayerData, Pellet } from "./clientGame"; // Explicit type import
import { gameLoop } from "./main"; // Assuming main.ts will export gameLoop

let socket: Socket;

export function getSocket(): Socket {
  return socket;
}

export function connectToServer(name: string) {
  if (socket && socket.connected) {
    socket.disconnect();
  }

  socket = io("http://localhost:3000", {
    // Consider adding reconnection options if desired
  });
  setupSocketListeners();
  socket.emit("requestJoin", { name });
}

export function requestJoin(name: string) {
  if (!socket || socket.disconnected) {
    // This implies a fresh connection or reconnection is needed
    connectToServer(name);
  } else {
    socket.emit("requestJoin", { name });
  }
}

export function requestRespawn(name: string) {
  if (!socket || socket.disconnected) {
    // Reconnect if disconnected, then request respawn
    socket = io("http://localhost:3000");
    setupSocketListeners(); // Important to re-setup listeners on new socket instance
    socket.on("connect", () => {
      // Wait for connection before emitting
      socket.emit("requestRespawn", { name });
    });
  } else {
    socket.emit("requestRespawn", { name });
  }
}

export function emitPlayerStateUpdate(data: { x: number; y: number }) {
  if (socket && socket.connected) {
    socket.emit("playerStateUpdate", data);
  }
}

function setupSocketListeners() {
  if (!socket) return;

  socket.on(
    "initialize",
    (data: {
      id: string;
      player: PlayerData;
      allPlayers: { [id: string]: PlayerData };
      pellets: { [id: string]: Pellet };
    }) => {
      updateLocalPlayer(data.player);
      let otherPlayersData = { ...data.allPlayers };
      if (data.player) {
        delete otherPlayersData[data.player.id];
      }
      updateOtherPlayers(otherPlayersData);
      updatePellets(data.pellets);
      setGameOver(false);
      showGameUI();
      updateLeaderboard();
      setAnimationFrameId(requestAnimationFrame(gameLoop));
    },
  );

  socket.on(
    "gameStateUpdate",
    (data: {
      players: { [id: string]: PlayerData };
      pellets: { [id: string]: Pellet };
    }) => {
      if (localPlayer && data.players[localPlayer.id]) {
        const serverLocalPlayerState = data.players[localPlayer.id];
        // Preserve client's position for smoothness, server is authoritative for radius, color, name
        updateLocalPlayer({
          ...localPlayer,
          radius: serverLocalPlayerState.radius,
          color: serverLocalPlayerState.color,
          name: serverLocalPlayerState.name,
        });
        let otherPlayersData = { ...data.players };
        delete otherPlayersData[localPlayer.id];
        updateOtherPlayers(otherPlayersData);
      } else if (localPlayer && !data.players[localPlayer.id] && !isGameOver) {
        // Local player not in update, might be eaten. Wait for 'gameOver'.
      } else {
        updateOtherPlayers(data.players); // For spectators or if localPlayer is null
      }
      updatePellets(data.pellets);
      updateLeaderboard();
    },
  );

  socket.on("playerJoined", (newPlayer: PlayerData) => {
    if (localPlayer && newPlayer.id !== localPlayer.id) {
      const currentOtherPlayers = { ...otherPlayers }; // Create a new object
      currentOtherPlayers[newPlayer.id] = newPlayer;
      updateOtherPlayers(currentOtherPlayers);
    }
    updateLeaderboard();
  });

  socket.on("playerLeft", (playerId: string) => {
    const currentOtherPlayers = { ...otherPlayers };
    delete currentOtherPlayers[playerId];
    updateOtherPlayers(currentOtherPlayers);
    updateLeaderboard();
  });

  socket.on(
    "gameOver",
    (data: {
      eaterId?: string;
      eatenId?: string;
      winnerName?: string;
      loserName?: string;
    }) => {
      if (localPlayer && data.eatenId === localPlayer.id) {
        setGameOver(true);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        setAnimationFrameId(null);
        const message = data.winnerName
          ? `You were eaten by ${data.winnerName}!`
          : "You were eaten!";
        showGameOverUI(message);
        if (socket) socket.disconnect();
      } else if (localPlayer && data.eaterId === localPlayer.id) {
        console.log(`You ate ${data.loserName || "another player"}!`);
      }
      updateLeaderboard();
    },
  );

  socket.on(
    "playerEaten",
    ({
      eaterId,
      eatenId,
      newRadius,
    }: {
      eaterId: string;
      eatenId: string;
      newRadius: number;
    }) => {
      if (localPlayer && eaterId === localPlayer.id) {
        updateLocalPlayer({ ...localPlayer, radius: newRadius });
      } else if (otherPlayers[eaterId]) {
        const currentOtherPlayers = { ...otherPlayers };
        currentOtherPlayers[eaterId] = {
          ...currentOtherPlayers[eaterId],
          radius: newRadius,
        };
        updateOtherPlayers(currentOtherPlayers);
      }

      if (localPlayer && eatenId === localPlayer.id) {
        // Game over for local player, 'gameOver' event will handle UI
      } else {
        const currentOtherPlayers = { ...otherPlayers };
        delete currentOtherPlayers[eatenId];
        updateOtherPlayers(currentOtherPlayers);
      }
      updateLeaderboard();
    },
  );

  socket.on("playerRespawned", (respawnedPlayer: PlayerData) => {
    if (localPlayer && respawnedPlayer.id === localPlayer.id) {
      updateLocalPlayer(respawnedPlayer);
      setGameOver(false);
      showGameUI();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(requestAnimationFrame(gameLoop));
    } else {
      const currentOtherPlayers = { ...otherPlayers };
      currentOtherPlayers[respawnedPlayer.id] = respawnedPlayer;
      updateOtherPlayers(currentOtherPlayers);
    }
    updateLeaderboard();
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server.");
    // If not a game over scenario, show main menu
    // if (!isGameOver) {
    //     showMainMenu();
    //     resetGameState();
    // }
  });

  socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
    showMainMenu(); // Show main menu on connection error
    resetGameState();
  });
}
