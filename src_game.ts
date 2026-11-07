export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Ball = {
  position: Vector3;
  velocity: Vector3;
};

export type Arena = {
  radius: number;
  height: number;
};

export function getSpeedMultiplier(position: Vector3, arena: Arena): number {
  // Use the X/Z plane to determine the ball's position within the hexagonal arena.
  const distanceFromCenter = Math.hypot(position.x, position.z);
  const outerZoneStart = arena.radius * 0.65;

  return distanceFromCenter >= outerZoneStart ? 1.4 : 1;
}

export function updateBall(
  ball: Ball,
  arena: Arena,
  deltaSeconds: number,
): Ball {
  const speedMultiplier = getSpeedMultiplier(ball.position, arena);

  return {
    ...ball,
    position: {
      x: ball.position.x + ball.velocity.x * speedMultiplier * deltaSeconds,
      y: ball.position.y + ball.velocity.y * speedMultiplier * deltaSeconds,
      z: ball.position.z + ball.velocity.z * speedMultiplier * deltaSeconds,
    },
  };
}