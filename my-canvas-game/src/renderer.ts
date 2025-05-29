// renderer.ts
import {
  localPlayer,
  otherPlayers,
  pellets,
  isGameOver,
  // PlayerData, // Will be imported as type
  // Pellet, // Will be imported as type
} from "./clientGame";
import type { PlayerData, Pellet } from "./clientGame"; // Explicit type import

const gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = gameCanvas.getContext("2d")!;

// Ensure canvas dimensions are set (they are also set in main.ts, but good for module independence)
gameCanvas.width = 800;
gameCanvas.height = 600;

export function drawPlayer(player: PlayerData) {
  if (!ctx) return;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();

  // Draw name
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(player.name, player.x, player.y - player.radius - 5);
}

export function drawPellet(pellet: Pellet) {
  if (!ctx) return;
  ctx.beginPath();
  ctx.arc(pellet.x, pellet.y, pellet.radius, 0, Math.PI * 2);
  ctx.fillStyle = pellet.color;
  ctx.fill();
  ctx.closePath();
}

export function renderGame() {
  if (!ctx || !gameCanvas) return;

  // Clear the canvas
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  if (isGameOver || !localPlayer) {
    // Potentially draw a game over message or leave blank
    return;
  }

  // Draw server-controlled pellets
  Object.values(pellets).forEach((pellet) => {
    drawPellet(pellet);
  });

  // Render Local Player
  if (localPlayer && !isGameOver) {
    drawPlayer(localPlayer);
  }

  // Render Other Players
  Object.values(otherPlayers).forEach((p) => {
    if (!(isGameOver && localPlayer && p.id === localPlayer.id)) {
      drawPlayer(p);
    }
  });
}
