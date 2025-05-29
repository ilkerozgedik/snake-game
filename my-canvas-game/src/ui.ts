// ui.ts
import {
  localPlayer,
  otherPlayers,
  isGameOver,
  // PlayerData, // Will be imported as type
  currentName,
} from "./clientGame";
import type { PlayerData } from "./clientGame"; // Explicit type import
import { getSocket, requestJoin, requestRespawn } from "./network"; // Assuming network.ts will export these

// UI Elements
export const mainMenu = document.getElementById("mainMenu")!;
export const playerNameInput = document.getElementById(
  "playerNameInput",
) as HTMLInputElement;
export const playButton = document.getElementById("playButton")!;
export const gameCanvas = document.getElementById(
  "gameCanvas",
) as HTMLCanvasElement;
export const leaderboardDiv = document.getElementById("leaderboard")!;
export const gameOverScreen = document.getElementById("gameOverScreen")!;
export const gameOverMessage = document.getElementById("gameOverMessage")!;
export const playAgainButton = document.getElementById("playAgainButton")!;
export const backToMenuButton = document.getElementById("backToMenuButton")!;
export const leaderboardList = document.getElementById("leaderboardList")!;

export function showMainMenu() {
  mainMenu.style.display = "flex";
  gameCanvas.style.display = "none";
  leaderboardDiv.style.display = "none";
  gameOverScreen.style.display = "none";
}

export function showGameUI() {
  mainMenu.style.display = "none";
  gameCanvas.style.display = "block";
  leaderboardDiv.style.display = "block";
  gameOverScreen.style.display = "none";
}

export function showGameOverUI(message: string) {
  mainMenu.style.display = "none";
  gameCanvas.style.display = "none";
  leaderboardDiv.style.display = "none";
  gameOverScreen.style.display = "block";
  gameOverMessage.textContent = message;
}

export function updateLeaderboard() {
  if (!leaderboardList) return;
  leaderboardList.innerHTML = "";

  const playersArray: PlayerData[] = [];
  if (localPlayer && !isGameOver) {
    playersArray.push(localPlayer);
  }
  Object.values(otherPlayers).forEach((p) => {
    if (!localPlayer || p.id !== localPlayer.id) {
      // Ensure not to add local player twice if they are in otherPlayers
      playersArray.push(p);
    }
  });

  playersArray.sort((a, b) => b.radius - a.radius);

  const topN = 5;
  playersArray.slice(0, topN).forEach((p) => {
    const li = document.createElement("li");
    let displayName = p.name || `Player ${p.id.substring(0, 4)}`;
    if (localPlayer && p.id === localPlayer.id && !isGameOver) {
      displayName = `${p.name} (You)`;
      li.style.fontWeight = "bold";
    }
    li.textContent = `${displayName}: ${Math.round(p.radius)}`;
    leaderboardList.appendChild(li);
  });
}

export function initializeUIEventListeners() {
  playButton.addEventListener("click", () => {
    const name =
      playerNameInput.value.trim() ||
      `Player_${Math.floor(Math.random() * 1000)}`;
    playerNameInput.value = name; // Update input field with actual name used
    requestJoin(name); // This will be handled by network.ts to emit
  });

  playAgainButton.addEventListener("click", () => {
    requestRespawn(currentName); // Use currentName from clientGame
  });

  backToMenuButton.addEventListener("click", () => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.disconnect();
    }
    showMainMenu();
    // Resetting game state might be handled in clientGame or main after this
    // For now, just show menu. clientGame.resetGameState() could be called from main.ts
  });
}
