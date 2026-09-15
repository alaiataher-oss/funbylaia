import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sfx } from "../audio/sfx.js";
import {
  LANES,
  BASE_SPEED,
  MAX_SPEED,
  SPEED_STEP_EVERY,
  SPEED_STEP,
  JUMP_DURATION,
  JUMP_HEIGHT,
  LANE_LERP,
  POOL_CARS,
  POOL_COINS,
  POOL_HAZARDS,
  POOL_POWERS,
  clamp,
  randInt,
  pick,
} from "./constants";

const VEHICLE_KINDS = ["car", "taxi", "bus", "truck", "motor"];
const POWER_KINDS = ["shield", "magnet"];
const POWER_DURATION = 10;

function makePool(n, factory) {
  return Array.from({ length: n }, () => factory());
}

function inactiveVehicle() {
  return {
    active: false,
    kind: "car",
    lane: 1,
    targetLane: 1,
    x: 0,
    z: 0,
    speed: 0,
    w: 1.4,
    h: 1.1,
    d: 2.4,
    switchAt: 0,
    switching: false,
    warn: false,
    fromBehind: false,
    queued: false,
  };
}

function inactiveCoin() {
  return { active: false, lane: 1, x: 0, y: 0.6, z: 0 };
}

function inactiveHazard() {
  return { active: false, kind: "barrier", lane: 1, x: 0, z: 0, low: true };
}

function inactivePower() {
  return { active: false, kind: "shield", lane: 1, x: 0, z: 0 };
}

function vehicleSize(kind) {
  if (kind === "bus") return { w: 1.7, h: 1.7, d: 4.2 };
  if (kind === "truck") return { w: 1.8, h: 1.9, d: 3.6 };
  if (kind === "motor") return { w: 0.7, h: 1.15, d: 1.6 };
  if (kind === "taxi") return { w: 1.45, h: 1.15, d: 2.5 };
  return { w: 1.4, h: 1.1, d: 2.4 };
}

function vehicleColor(kind) {
  if (kind === "taxi") return "#facc15";
  if (kind === "bus") return "#38bdf8";
  if (kind === "truck") return "#fb923c";
  if (kind === "motor") return "#a78bfa";
  return pick(["#ef4444", "#22c55e", "#3b82f6", "#e2e8f0", "#64748b"]);
}

/** Pure game simulation updated each frame; visuals read refs. */
export function useOjolSim({ running, paused, mutedRef, onCrash, onHud, inputRef }) {
  const state = useRef({
    t: 0,
    dist: 0,
    coins: 0,
    score: 0,
    nearMiss: 0,
    speed: BASE_SPEED,
    lane: 1,
    laneX: 0,
    jumpT: -1,
    shield: 0,
    magnet: 0,
    slow: 0, // unused — kept off
    turbo: 0, // unused
    nextSpawn: 1.8,
    nextCoin: 0.6,
    nextHazard: 5.5,
    nextPower: 7,
    nextRear: 14,
    phase: "day", // day | rain | night
    light: "green", // green | yellow | red
    lightT: 0,
    nextLight: 55,
    brake: 0,
    lightZ: -40,
    lightQueued: false,
    redHold: 0,
    shake: 0,
    dead: false,
  });

  const pools = useMemo(
    () => ({
      cars: makePool(POOL_CARS, inactiveVehicle),
      coins: makePool(POOL_COINS, inactiveCoin),
      hazards: makePool(POOL_HAZARDS, inactiveHazard),
      powers: makePool(POOL_POWERS, inactivePower),
    }),
    []
  );

  const playerGroup = useRef();
  const worldGroup = useRef();

  const freeLaneNear = (z, pad = 9) => {
    const blocked = new Set(
      pools.cars.filter((v) => v.active && Math.abs(v.z - z) < pad).map((v) => v.lane)
    );
    const free = [0, 1, 2].filter((l) => !blocked.has(l));
    return { blocked, free };
  };

  const spawnVehicle = (z, opts = {}) => {
    const s = state.current;
    const slot = pools.cars.find((v) => !v.active);
    if (!slot) return null;
    const fromBehind = !!opts.fromBehind;
    const queued = !!opts.queued;
    const { blocked, free } = freeLaneNear(z, fromBehind ? 11 : queued ? 3 : 10);
    let lane = opts.lane != null ? opts.lane : randInt(0, 2);
    if (!queued) {
      if (free.length) {
        if (blocked.has(lane) || blocked.size >= 2) lane = pick(free);
      } else if (!fromBehind) {
        return null;
      }
      if (!fromBehind && free.length > 1 && lane === s.lane) {
        const alt = free.filter((l) => l !== s.lane);
        if (alt.length) lane = pick(alt);
      }
    }
    const kind = opts.kind || pick(VEHICLE_KINDS);
    const size = vehicleSize(kind);
    let rel;
    if (queued) {
      rel = 0;
    } else if (fromBehind) {
      rel = 1.22 + Math.random() * 0.28;
    } else if (kind === "motor") {
      rel = 0.4 + Math.random() * 0.3;
    } else if (kind === "bus") {
      rel = 0.08 + Math.random() * 0.1;
    } else if (kind === "truck") {
      rel = 0.1 + Math.random() * 0.12;
    } else {
      rel = 0.16 + Math.random() * 0.24;
    }
    const weaveChance = queued
      ? 0
      : fromBehind
        ? 0.2
        : kind === "motor"
          ? 0.4
          : kind === "car" || kind === "taxi"
            ? 0.22
            : 0.08;
    Object.assign(slot, {
      active: true,
      kind,
      lane,
      targetLane: lane,
      x: LANES[lane],
      z,
      speed: queued ? 0 : s.speed * rel,
      ...size,
      switchAt: Math.random() < weaveChance ? s.t + 1.2 + Math.random() * 2.5 : 0,
      switching: false,
      switchT: 0,
      warn: false,
      fromBehind,
      queued,
      color: fromBehind ? pick(["#16a34a", "#0f766e", "#334155", "#1d4ed8"]) : vehicleColor(kind),
      _missed: false,
    });
    return slot;
  };

  /** Cars waiting at the stop line — why you actually stop on red */
  const spawnRedLightQueue = () => {
    const s = state.current;
    const stopZ = s.lightZ + 6.5;
    // clear clutter near the intersection so the queue reads clearly
    for (const v of pools.cars) {
      if (v.active && !v.fromBehind && v.z < stopZ + 10 && v.z > stopZ - 22) {
        v.active = false;
      }
    }
    // front row: all 3 lanes blocked at the line
    const frontKinds = ["car", "taxi", "car"];
    for (let lane = 0; lane < 3; lane += 1) {
      spawnVehicle(stopZ - 0.4 - lane * 0.15, {
        queued: true,
        lane,
        kind: frontKinds[lane],
      });
    }
    // second row: 1–2 cars further back (jam depth)
    const backLanes = pick([
      [0, 2],
      [0, 1],
      [1, 2],
    ]);
    backLanes.forEach((lane, i) => {
      spawnVehicle(stopZ - 3.4 - i * 0.35, {
        queued: true,
        lane,
        kind: pick(["car", "taxi", "truck"]),
      });
    });
    // optional motor squeezed at the side of the queue
    if (Math.random() < 0.65) {
      spawnVehicle(stopZ - 5.2, {
        queued: true,
        lane: pick([0, 2]),
        kind: "motor",
      });
    }
    s.lightQueued = true;
  };

  const releaseRedLightQueue = () => {
    const s = state.current;
    for (const v of pools.cars) {
      if (!v.active || !v.queued) continue;
      v.queued = false;
      // pull forward through the intersection then despawn ahead
      v.speed = s.speed * (1.15 + Math.random() * 0.35);
      v.switchAt = 0;
      v.switching = false;
    }
    s.lightQueued = false;
  };

  const spawnRearMotor = () => {
    const s = state.current;
    const prefer = pick([0, 2, s.lane === 1 ? pick([0, 2]) : s.lane]);
    const { free } = freeLaneNear(8, 12);
    if (!free.length) return null;
    const lane = free.includes(prefer) ? prefer : pick(free);
    return spawnVehicle(9 + Math.random() * 6, { fromBehind: true, kind: "motor", lane });
  };

  const spawnCoin = (z, lane) => {
    const slot = pools.coins.find((c) => !c.active);
    if (!slot) return;
    Object.assign(slot, {
      active: true,
      lane,
      x: LANES[lane],
      y: 0.55,
      z,
    });
  };

  const spawnHazard = (z) => {
    const slot = pools.hazards.find((h) => !h.active);
    if (!slot) return;
    const kind = pick(["barrier", "hole", "cone"]);
    // prefer not player's lane when possible
    let lane = randInt(0, 2);
    if (lane === state.current.lane && Math.random() < 0.55) {
      lane = pick([0, 1, 2].filter((l) => l !== state.current.lane));
    }
    Object.assign(slot, {
      active: true,
      kind,
      lane,
      x: LANES[lane],
      z,
      low: kind !== "hole",
    });
  };

  const spawnPower = (z) => {
    const slot = pools.powers.find((p) => !p.active);
    if (!slot) return;
    const lane = randInt(0, 2);
    Object.assign(slot, {
      active: true,
      kind: pick(POWER_KINDS),
      lane,
      x: LANES[lane],
      z,
    });
  };

  useFrame((_, dt) => {
    const s = state.current;
    const input = inputRef.current;
    if (!running || paused || s.dead) {
      onHud?.({ ...hudSnapshot(s), paused, dead: s.dead });
      return;
    }

    const dtClamped = Math.min(dt, 0.05);
    s.t += dtClamped;

    // difficulty
    const steps = Math.floor(s.t / SPEED_STEP_EVERY);
    s.speed = clamp(BASE_SPEED + steps * SPEED_STEP, BASE_SPEED, MAX_SPEED);
    if (s.t > 70 && s.t < 115) s.phase = "rain";
    else if (s.t >= 115) s.phase = "night";
    else s.phase = "day";

    // traffic light — spawn a real queue; brake because of cars + stop line
    s.lightT += dtClamped;
    const stopLine = s.lightZ + 6.5;

    if (s.light === "green") {
      s.nextLight -= dtClamped;
      if (s.brake > 0) s.brake = Math.max(0, s.brake - dtClamped * 0.95);
      if (s.nextLight <= 0) {
        s.light = "yellow";
        s.lightT = 0;
        s.lightZ = -48 - Math.random() * 6;
        spawnRedLightQueue();
      }
    } else if (s.light === "yellow") {
      if (s.lightT >= 2.4) {
        s.light = "red";
        s.lightT = 0;
      }
    } else if (s.light === "red") {
      // only count hold once you're actually stopped behind the queue
      if (s.brake > 0.92) s.redHold += dtClamped;
      else s.redHold = 0;
      if (s.redHold >= 2.6) {
        s.light = "green";
        s.lightT = 0;
        s.redHold = 0;
        s.nextLight = 60 + Math.random() * 25;
        releaseRedLightQueue();
      }
    }

    // distance-based braking toward the queued traffic / stop line (not random)
    if (s.light === "yellow" || s.light === "red") {
      // nearest queued bumper ahead of player
      let nearest = stopLine;
      for (const v of pools.cars) {
        if (v.active && v.queued && v.z < -0.5) nearest = Math.max(nearest, v.z);
      }
      // nearest is negative when ahead; approach → brake harder
      const dist = -nearest; // meters-ish ahead
      let target = 0;
      if (dist < 32) {
        target = clamp(1 - (dist - 4) / 28, 0, 1);
        if (s.light === "red" && dist < 12) target = Math.max(target, 0.85);
        if (s.light === "red" && dist < 7) target = 1;
      }
      // ease toward target so it feels like you're stopping for the jam
      s.brake += (target - s.brake) * Math.min(1, (s.light === "red" ? 3.2 : 2.2) * dtClamped);
      s.brake = clamp(s.brake, 0, 1);
    }

    // input — consume one lane change per press/swipe
    if (input.left) {
      s.lane = clamp(s.lane - 1, 0, 2);
      input.left = false;
      if (!mutedRef.current) sfx.click();
    }
    if (input.right) {
      s.lane = clamp(s.lane + 1, 0, 2);
      input.right = false;
      if (!mutedRef.current) sfx.click();
    }
    if (input.jump && s.jumpT < 0) {
      s.jumpT = 0;
      input.jump = false;
      if (!mutedRef.current) sfx.jump();
    } else if (input.jump) {
      input.jump = false;
    }

      s.laneX += (LANES[s.lane] - s.laneX) * (1 - Math.exp(-LANE_LERP * dtClamped));

    let py = 0;
    if (s.jumpT >= 0) {
      s.jumpT += dtClamped;
      const u = s.jumpT / JUMP_DURATION;
      if (u >= 1) s.jumpT = -1;
      else py = Math.sin(u * Math.PI) * JUMP_HEIGHT;
    }

    // power timers
    for (const k of ["shield", "magnet"]) {
      if (s[k] > 0) s[k] = Math.max(0, s[k] - dtClamped);
    }

    const moveScale = 1 - s.brake * 0.98;
    const worldSpeed = s.speed * moveScale;
    // scroll signal with the road (queue cars scroll themselves via z += worldSpeed)
    if (s.light !== "green" || s.brake > 0.05) {
      s.lightZ += worldSpeed * dtClamped;
    }
    s.dist += worldSpeed * dtClamped;
    s.score = Math.floor(s.dist * 2 + s.coins * 15 + s.nearMiss * 40 + s.t * 3);

    // spawn — no random traffic while a red-light queue is active
    s.nextSpawn -= dtClamped;
    s.nextCoin -= dtClamped;
    s.nextHazard -= dtClamped;
    s.nextPower -= dtClamped;
    s.nextRear -= dtClamped;
    const density = clamp(1.55 - steps * 0.05, 0.85, 1.55);
    const canSpawn = s.light === "green" && s.brake < 0.45 && !s.lightQueued;
    if (canSpawn && s.nextSpawn <= 0) {
      spawnVehicle(-58 - Math.random() * 22);
      if (steps >= 2 && Math.random() < 0.18 + steps * 0.02) {
        spawnVehicle(-78 - Math.random() * 18);
      }
      s.nextSpawn = density * (1.05 + Math.random() * 0.75);
    }
    if (canSpawn && s.nextCoin <= 0) {
      const lane = randInt(0, 2);
      const z0 = -40 - Math.random() * 30;
      for (let i = 0; i < 4; i += 1) spawnCoin(z0 - i * 2.2, lane);
      s.nextCoin = 0.9 + Math.random() * 0.8;
    }
    if (canSpawn && s.nextHazard <= 0) {
      spawnHazard(-55 - Math.random() * 25);
      s.nextHazard = 4.2 + Math.random() * 2.8 - Math.min(0.8, steps * 0.05);
    }
    if (canSpawn && s.nextPower <= 0) {
      spawnPower(-45 - Math.random() * 20);
      s.nextPower = 9 + Math.random() * 7;
    }
    if (canSpawn && s.t > 12 && s.nextRear <= 0) {
      spawnRearMotor();
      s.nextRear = 7.5 + Math.random() * 5 - Math.min(1.5, steps * 0.12);
    }

    const playerHit = {
      x: s.laneX,
      y: py,
      z: 0,
      w: 0.5,
      h: 1.2,
      d: 1.0,
    };

    // vehicles
    for (const v of pools.cars) {
      if (!v.active) continue;
      if (v.queued) {
        v.speed = 0;
        v.z += worldSpeed * dtClamped;
        v.x = LANES[v.lane];
      } else {
        v.z += (worldSpeed - v.speed * moveScale) * dtClamped;
      }

      if (!v.queued && v.switchAt && s.t >= v.switchAt && !v.switching) {
        v.warn = true;
        if (s.t >= v.switchAt + 0.85) {
          const options = [0, 1, 2].filter((l) => l !== v.lane);
          // avoid switching into player's lane when close
          const safer = options.filter((l) => !(Math.abs(v.z) < 8 && l === s.lane));
          v.targetLane = pick(safer.length ? safer : options);
          v.switching = true;
          v.warn = false;
          v.switchAt = 0;
          v.switchT = 0;
        }
      }
      if (v.switching) {
        v.switchT = (v.switchT || 0) + dtClamped;
        const tx = LANES[v.targetLane];
        v.x += (tx - v.x) * (1 - Math.exp(-(v.kind === "motor" ? 6.5 : 4) * dtClamped));
        if (Math.abs(tx - v.x) < 0.04) {
          v.lane = v.targetLane;
          v.x = tx;
          v.switching = false;
          if (v.kind === "motor" && !v.fromBehind && Math.random() < 0.35) {
            v.switchAt = s.t + 1.4 + Math.random() * 2;
          }
        }
      }

      // front traffic despawns past player; rear motors continue ahead then despawn
      if (v.fromBehind) {
        if (v.z < -70) {
          v.active = false;
          continue;
        }
      } else if (v.queued) {
        // stay until released; if somehow past player, drop
        if (v.z > 14) {
          v.active = false;
          continue;
        }
      } else if (v.z > 14) {
        v.active = false;
        continue;
      } else if (v.z < -90) {
        // released queue cars that pulled far ahead
        v.active = false;
        continue;
      }

      // near miss
      if (!v._missed && v.z > -2.5 && v.z < 1.5 && Math.abs(v.x - s.laneX) > 0.9 && Math.abs(v.x - s.laneX) < 2.1) {
        v._missed = true;
        s.nearMiss += 1;
        if (!mutedRef.current) sfx.miss();
        if (navigator.vibrate) navigator.vibrate(18);
      }

      const hitScale = v.kind === "motor" ? 0.62 : 0.68;
      const hit =
        py < 0.85 &&
        aabb(playerHit, { x: v.x, y: 0, z: v.z, w: v.w * hitScale, h: v.h, d: v.d * hitScale });
      if (hit) {
        if (s.shield > 0) {
          s.shield = 0;
          v.active = false;
          s.shake = 0.2;
        } else {
          s.dead = true;
          s.shake = 0.35;
          if (!mutedRef.current) sfx.crash();
          if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
          onCrash?.({ ...hudSnapshot(s) });
        }
      }
    }

    // hazards
    for (const h of pools.hazards) {
      if (!h.active) continue;
      h.z += worldSpeed * dtClamped;
      if (h.z > 10) {
        h.active = false;
        continue;
      }
      const needJump = h.kind === "barrier" || h.kind === "cone" || h.kind === "hole";
      const clears = needJump && py > (h.kind === "hole" ? 0.35 : 0.7);
      if (
        !clears &&
        aabb(playerHit, {
          x: h.x,
          y: 0,
          z: h.z,
          w: 0.9,
          h: 0.8,
          d: h.kind === "hole" ? 1.4 : 0.8,
        })
      ) {
        if (s.shield > 0) {
          s.shield = 0;
          h.active = false;
        } else {
          s.dead = true;
          s.shake = 0.3;
          if (!mutedRef.current) sfx.crash();
          if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
          onCrash?.({ ...hudSnapshot(s) });
        }
      }
    }

    // coins
    for (const c of pools.coins) {
      if (!c.active) continue;
      c.z += worldSpeed * dtClamped;
      if (s.magnet > 0) {
        c.x += (s.laneX - c.x) * Math.min(1, 8 * dtClamped);
        c.y += (0.8 + py - c.y) * Math.min(1, 8 * dtClamped);
      }
      if (c.z > 8) {
        c.active = false;
        continue;
      }
      if (Math.abs(c.z) < 1.2 && Math.abs(c.x - s.laneX) < 0.9 && Math.abs(c.y - (0.5 + py)) < 1.1) {
        c.active = false;
        s.coins += 1;
        if (!mutedRef.current) sfx.coin();
      }
    }

    // powers
    for (const p of pools.powers) {
      if (!p.active) continue;
      p.z += worldSpeed * dtClamped;
      if (p.z > 8) {
        p.active = false;
        continue;
      }
      if (Math.abs(p.z) < 1.2 && Math.abs(p.x - s.laneX) < 1 && py < 1.2) {
        p.active = false;
        if (p.kind === "shield") s.shield = POWER_DURATION;
        if (p.kind === "magnet") s.magnet = POWER_DURATION;
        if (!mutedRef.current) sfx.power();
      }
    }

    if (s.shake > 0) s.shake = Math.max(0, s.shake - dtClamped);

    if (playerGroup.current) {
      playerGroup.current.position.set(s.laneX, py, 0);
      playerGroup.current.rotation.z = (LANES[s.lane] - s.laneX) * -0.08;
    }

    onHud?.({ ...hudSnapshot(s), paused: false, dead: s.dead });
  });

  return { state, pools, playerGroup, worldGroup };
}

function hudSnapshot(s) {
  return {
    score: s.score,
    dist: Math.floor(s.dist),
    coins: s.coins,
    speed: Math.round(s.speed * (1 - (s.brake || 0) * 0.98) * 3.6),
    shield: s.shield,
    magnet: s.magnet,
    light: s.light,
    brake: s.brake,
    phase: s.phase,
    shake: s.shake,
    nearMiss: s.nearMiss,
  };
}

function aabb(a, b) {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w &&
    Math.abs((a.y || 0) - (b.y || 0)) * 2 < (a.h || 1) + (b.h || 1) &&
    Math.abs(a.z - b.z) * 2 < a.d + b.d
  );
}

export function resetSim(stateRef, pools) {
  const s = stateRef.current;
  Object.assign(s, {
    t: 0,
    dist: 0,
    coins: 0,
    score: 0,
    nearMiss: 0,
    speed: BASE_SPEED,
    lane: 1,
    laneX: 0,
    jumpT: -1,
    shield: 0,
    magnet: 0,
    turbo: 0,
    slow: 0,
    nextSpawn: 1.8,
    nextCoin: 0.6,
    nextHazard: 5.5,
    nextPower: 7,
    nextRear: 14,
    phase: "day",
    light: "green",
    lightT: 0,
    nextLight: 55,
    brake: 0,
    lightZ: -40,
    lightQueued: false,
    redHold: 0,
    shake: 0,
    dead: false,
  });
  for (const v of pools.cars) v.active = false;
  for (const c of pools.coins) c.active = false;
  for (const h of pools.hazards) h.active = false;
  for (const p of pools.powers) p.active = false;
}

export { vehicleColor };
