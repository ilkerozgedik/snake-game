// main.ts
import { initializeUIEventListeners, showMainMenu, gameCanvas } from "./ui";
import { renderGame } from "./renderer";
import {
  localPlayer,
  isGameOver,
  setAnimationFrameId,
  animationFrameId,
  updateLocalPlayer,
} from "./clientGame";
import { emitPlayerStateUpdate } from "./network";

// Initialize the UI and event listeners
initializeUIEventListeners();
showMainMenu(); // Show main menu by default

// Main game loop function
export function gameLoop() {
  if (isGameOver || !localPlayer) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(null);
    }
    return;
  }

  renderGame(); // Call the main rendering function

  setAnimationFrameId(requestAnimationFrame(gameLoop));
}

// Mouse move event listener - stays in main.ts as it bridges UI (canvas) and network
gameCanvas.addEventListener("mousemove", (event) => {
  if (isGameOver || !localPlayer) return;

  const rect = gameCanvas.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;

  const radius = localPlayer.radius || 20; // Use a default if radius is somehow 0

  // Update local player's position for immediate feedback
  const newX = Math.max(radius, Math.min(gameCanvas.width - radius, mouseX));
  const newY = Math.max(radius, Math.min(gameCanvas.height - radius, mouseY));

  // Only update and emit if there's a change, to reduce network traffic slightly
  if (localPlayer.x !== newX || localPlayer.y !== newY) {
    updateLocalPlayer({
      ...localPlayer,
      x: newX,
      y: newY,
    });
    emitPlayerStateUpdate({ x: newX, y: newY });
  }
});

// Note: The game loop is started by network events ('initialize', 'playerRespawned')
// which will call setAnimationFrameId(requestAnimationFrame(gameLoop));
// The socket connection is initiated by UI events in ui.ts (playButton, playAgainButton)
// which call functions in network.ts.
