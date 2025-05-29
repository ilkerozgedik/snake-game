// clientGame.ts

export interface PlayerData {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  name: string;
}

export interface Pellet {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export let localPlayer: PlayerData | null = null;
export let otherPlayers: { [id: string]: PlayerData } = {};
export let pellets: { [id: string]: Pellet } = {};
export let isGameOver = false;
export let currentName = ""; // Stores the current player's name for join/respawn
export let animationFrameId: number | null = null;

export function updateLocalPlayer(player: PlayerData | null) {
  localPlayer = player;
  if (player) {
    currentName = player.name;
  }
}

export function updateOtherPlayers(players: { [id: string]: PlayerData }) {
  otherPlayers = players;
}

export function updatePellets(newPellets: { [id: string]: Pellet }) {
  pellets = newPellets;
}

export function setGameOver(status: boolean) {
  isGameOver = status;
}

export function setCurrentName(name: string) {
  currentName = name;
}

export function resetGameState() {
  localPlayer = null;
  otherPlayers = {};
  pellets = {};
  isGameOver = false;
  // currentName is preserved for respawn
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function setAnimationFrameId(id: number | null) {
  animationFrameId = id;
}
