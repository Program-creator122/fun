export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Ball = {
  position: Vector3;
  velocity: Vector3;
  radius: number;
};

export type Arena = {
  radius: number;
  height: number;
};

const WALL_COUNT = 6;
const COLLISION_PASSES = 8;

function getSpeedMultiplier(position: Vector3, arena: Arena): number {
  const distanceFromCenter = Math.hypot(position.x, position.z);
  const outerZoneStart = arena.radius * 0.65;

  return distanceFromCenter >= outerZoneStart ? 1.4 : 1;
}

function reflectVelocity(velocity: Vector3, normal: Vector3): Vector3 {
  const velocityAlongNormal =
    velocity.x * normal.x +
    velocity.y * normal.y +
    velocity.z * normal.z;

  // Only reflect if the ball is moving into the wall.
  if (velocityAlongNormal <= 0) {
    return velocity;
  }

  return {
    x: velocity.x - 2 * velocityAlongNormal * normal.x,
    y: velocity.y - 2 * velocityAlongNormal * normal.y,
    z: velocity.z - 2 * velocityAlongNormal * normal.z,
  };
}

function resolveCollisions(ball: Ball, arena: Arena): Ball {
  let { position, velocity } = ball;

  // A regular hexagon's apothem is its circumradius * cos(30°).
  // Reduce it by the ball radius so the ball stays inside the walls.
  const sideLimit = arena.radius * Math.cos(Math.PI / 6) - ball.radius;

  // Resolve side-wall collisions. Each normal points out of the arena.
  for (let pass = 0; pass < COLLISION_PASSES; pass++) {
    let correctedPosition = false;

    for (let side = 0; side < WALL_COUNT; side++) {
      const angle = (side * 2 * Math.PI) / WALL_COUNT;
      const normal = {
        x: Math.cos(angle),
        y: 0,
        z: Math.sin(angle),
      };

      const distanceFromCenter =
        position.x * normal.x + position.z * normal.z;

      if (distanceFromCenter > sideLimit) {
        const penetration = distanceFromCenter - sideLimit;

        position = {
          ...position,
          x: position.x - normal.x * penetration,
          z: position.z - normal.z * penetration,
        };
        velocity = reflectVelocity(velocity, normal);
        correctedPosition = true;
      }
    }

    if (!correctedPosition) break;
  }

  // Floor and ceiling limits for the ball's center.
  const verticalLimit = arena.height / 2 - ball.radius;

  if (position.y > verticalLimit) {
    position = { ...position, y: verticalLimit };
    velocity = reflectVelocity(velocity, { x: 0, y: 1, z: 0 });
  } else if (position.y < -verticalLimit) {
    position = { ...position, y: -verticalLimit };
    velocity = reflectVelocity(velocity, { x: 0, y: -1, z: 0 });
  }

  return { ...ball, position, velocity };
}

export function updateBall(
  ball: Ball,
  arena: Arena,
  deltaSeconds: number,
): Ball {
  if (deltaSeconds <= 0) return ball;

  const speedMultiplier = getSpeedMultiplier(ball.position, arena);
  const velocity = {
    x: ball.velocity.x * speedMultiplier,
    y: ball.velocity.y * speedMultiplier,
    z: ball.velocity.z * speedMultiplier,
  };

  // Small steps help prevent a fast-moving ball from passing through a wall
  // between collision checks.
  const distanceToTravel =
    Math.hypot(velocity.x, velocity.y, velocity.z) * deltaSeconds;
  const maxStepDistance = Math.max(ball.radius / 2, 0.01);
  const steps = Math.max(1, Math.ceil(distanceToTravel / maxStepDistance));
  const stepSeconds = deltaSeconds / steps;

  let updatedBall = { ...ball, velocity };

  for (let step = 0; step < steps; step++) {
    updatedBall = {
      ...updatedBall,
      position: {
        x: updatedBall.position.x + updatedBall.velocity.x * stepSeconds,
        y: updatedBall.position.y + updatedBall.velocity.y * stepSeconds,
        z: updatedBall.position.z + updatedBall.velocity.z * stepSeconds,
      },
    };

    updatedBall = resolveCollisions(updatedBall, arena);
  }

  return updatedBall;
}