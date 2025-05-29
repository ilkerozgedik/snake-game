// gameLogic.ts

export interface Player {
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

export const players: Map<string, Player> = new Map();
export const pellets: Map<string, Pellet> = new Map();

const MAX_PELLETS = 50;
const PELLET_RADIUS = 5;
const CANVAS_WIDTH = 800; // Assuming canvas width
const CANVAS_HEIGHT = 600; // Assuming canvas height

export function spawnPellet() {
  if (pellets.size >= MAX_PELLETS) return; // Don't overpopulate

  const pelletId = `pellet-${Math.random().toString(36).substr(2, 9)}`;
  const pellet: Pellet = {
    id: pelletId,
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_HEIGHT,
    radius: PELLET_RADIUS,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  };
  pellets.set(pelletId, pellet);
}

export function initializePellets() {
  pellets.clear();
  for (let i = 0; i < MAX_PELLETS; i++) {
    spawnPellet();
  }
}

export function checkCircleCollision(
  circle1: { x: number; y: number; radius: number },
  circle2: { x: number; y: number; radius: number },
): boolean {
  const dist = Math.hypot(circle1.x - circle2.x, circle1.y - circle2.y);
  return dist <= circle1.radius + circle2.radius; // Collision if distance is less than or equal to sum of radii
}

export function handlePlayerPelletCollision(playerId: string) {
  const player = players.get(playerId);
  if (!player) return;

  pellets.forEach((pellet) => {
    if (pellets.has(pellet.id) && checkCircleCollision(player, pellet)) {
      player.radius += 1; // Growth factor
      pellets.delete(pellet.id);
      spawnPellet(); // Maintain pellet count
    }
  });
}

// Returns array of eaten player IDs
export function handlePlayerVsPlayerCollisions(io: any): string[] {
  // io needed to emit 'gameOver'
  const eatenPlayerIds: string[] = [];
  const playerIds = Array.from(players.keys());

  for (let i = 0; i < playerIds.length; i++) {
    const p1Id = playerIds[i];
    const p1 = players.get(p1Id);
    if (!p1 || eatenPlayerIds.includes(p1Id)) continue;

    for (let j = i + 1; j < playerIds.length; j++) {
      const p2Id = playerIds[j];
      const p2 = players.get(p2Id);
      if (!p2 || eatenPlayerIds.includes(p2Id)) continue;

      const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);

      if (
        distance < p1.radius - p2.radius * 0.8 &&
        p1.radius > p2.radius * 1.1
      ) {
        // p1 eats p2
        p1.radius += p2.radius / 2;
        eatenPlayerIds.push(p2.id);
        io.to(p2.id).emit("gameOver", {
          eaterId: p1.id,
          eatenId: p2.id,
          winnerName: p1.name,
          loserName: p2.name,
        });
        io.emit("playerEaten", {
          eaterId: p1.id,
          eatenId: p2.id,
          newRadius: p1.radius,
        });
        console.log(`${p1.name} (id: ${p1.id}) ate ${p2.name} (id: ${p2.id})`);
      } else if (
        distance < p2.radius - p1.radius * 0.8 &&
        p2.radius > p1.radius * 1.1
      ) {
        // p2 eats p1
        p2.radius += p1.radius / 2;
        eatenPlayerIds.push(p1.id);
        io.to(p1.id).emit("gameOver", {
          eaterId: p2.id,
          eatenId: p1.id,
          winnerName: p2.name,
          loserName: p1.name,
        });
        io.emit("playerEaten", {
          eaterId: p2.id,
          eatenId: p1.id,
          newRadius: p2.radius,
        });
        console.log(`${p2.name} (id: ${p2.id}) ate ${p1.name} (id: ${p1.id})`);
        break; // p1 is eaten, so it cannot eat others in this iteration.
      }
    }
  }
  // Note: We are not deleting players from the 'players' map here.
  // The 'gameOver' event on the client handles their state.
  // They are removed from the 'players' map only on disconnect.
  return eatenPlayerIds;
}

export function createNewPlayer(id: string, name: string): Player {
  const startX = Math.random() * CANVAS_WIDTH;
  const startY = Math.random() * CANVAS_HEIGHT;
  const initialRadius = 20;
  const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

  return {
    id,
    x: startX,
    y: startY,
    radius: initialRadius,
    color: randomColor,
    name: name || `Player_${id.substring(0, 4)}`,
  };
}

export function respawnPlayer(player: Player, name?: string): Player {
  player.x = Math.random() * CANVAS_WIDTH;
  player.y = Math.random() * CANVAS_HEIGHT;
  player.radius = 20; // Initial radius
  if (name) {
    // Update name if provided, otherwise keep old name
    player.name = name;
  }
  return player;
}

export function updatePlayerPosition(playerId: string, x: number, y: number) {
  const player = players.get(playerId);
  if (player) {
    player.x = x;
    player.y = y;
  }
}
