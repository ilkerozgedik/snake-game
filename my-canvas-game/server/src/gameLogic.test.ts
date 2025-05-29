import { describe, it, expect } from "vitest";
import {
  checkCircleCollision,
  spawnPellet,
  pellets,
  players,
  Player,
  Pellet,
  handlePlayerPelletCollision,
} from "./gameLogic"; // Assuming gameLogic.ts is in the same directory

describe("checkCircleCollision", () => {
  it("should return true when circles are overlapping", () => {
    const circle1 = { x: 0, y: 0, radius: 10 };
    const circle2 = { x: 5, y: 5, radius: 10 };
    expect(checkCircleCollision(circle1, circle2)).toBe(true);
  });

  it("should return false when circles are not overlapping", () => {
    const circle1 = { x: 0, y: 0, radius: 10 };
    const circle2 = { x: 30, y: 30, radius: 10 };
    expect(checkCircleCollision(circle1, circle2)).toBe(false);
  });

  it("should return true when circles are touching at the edge", () => {
    const circle1 = { x: 0, y: 0, radius: 10 };
    const circle2 = { x: 20, y: 0, radius: 10 };
    expect(checkCircleCollision(circle1, circle2)).toBe(true); // Collision if distance < sum of radii
  });

  it("should return false when one circle is inside another but not considered collision by typical game logic (dist < r1+r2)", () => {
    // This test depends on how you define "collision". If it's just overlap, this should be true.
    // If it's for consumption where one must be smaller, this test might change.
    // Current checkCircleCollision is simple overlap.
    const circle1 = { x: 0, y: 0, radius: 20 };
    const circle2 = { x: 0, y: 0, radius: 5 };
    expect(checkCircleCollision(circle1, circle2)).toBe(true);
  });
});

describe("handlePlayerPelletCollision", () => {
  it("should increase player radius and remove pellet on collision", () => {
    // Setup initial state
    players.clear();
    pellets.clear();

    const player: Player = {
      id: "player1",
      x: 10,
      y: 10,
      radius: 20,
      color: "blue",
      name: "TestPlayer",
    };
    players.set(player.id, player);

    const pellet: Pellet = {
      id: "pellet1",
      x: 12,
      y: 12,
      radius: 5,
      color: "green",
    };
    pellets.set(pellet.id, pellet);

    const initialPelletCount = pellets.size;

    handlePlayerPelletCollision(player.id);

    expect(player.radius).toBeGreaterThan(20);
    expect(pellets.has("pellet1")).toBe(false);
    expect(pellets.size).toBe(initialPelletCount); // spawnPellet should maintain count
  });

  it("should not change player radius if no collision", () => {
    players.clear();
    pellets.clear();

    const player: Player = {
      id: "player1",
      x: 100,
      y: 100,
      radius: 20,
      color: "blue",
      name: "TestPlayer",
    };
    players.set(player.id, player);

    const pellet: Pellet = {
      id: "pellet1",
      x: 10,
      y: 10,
      radius: 5,
      color: "green",
    };
    pellets.set(pellet.id, pellet);

    const initialRadius = player.radius;
    const initialPelletCount = pellets.size;

    handlePlayerPelletCollision(player.id);

    expect(player.radius).toBe(initialRadius);
    expect(pellets.has("pellet1")).toBe(true);
    expect(pellets.size).toBe(initialPelletCount);
  });
});
