import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useOjolSim, resetSim } from "./game/sim";
import {
  Cityscape,
  CityscapeLite,
  Rider,
  PooledWorld,
  FollowCam,
  Road,
  TrafficLight,
} from "./game/SceneBits";
import { loadBest, saveBest, loadSoundOn, saveSoundOn } from "./game/constants";
import { sfx, setMuted, startMusic, stopMusic } from "./audio/sfx";

const POWER_RING_R = 18;
const POWER_RING_C = 2 * Math.PI * POWER_RING_R;

function PowerRing({ kind, icon, label, remain, total }) {
  const pct = Math.max(0, Math.min(1, remain / total));
  const offset = POWER_RING_C * (1 - pct);
  return (
    <div
      className={`ojol-power-ring ojol-power-ring--${kind}`}
      role="status"
      aria-label={`${label} ${remain.toFixed(1)} seconds remaining`}
    >
      <svg className="ojol-power-ring-svg" viewBox="0 0 44 44" aria-hidden="true">
        <circle className="ojol-power-ring-track" cx="22" cy="22" r={POWER_RING_R} />
        <circle
          className="ojol-power-ring-progress"
          cx="22"
          cy="22"
          r={POWER_RING_R}
          strokeDasharray={POWER_RING_C}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="ojol-power-ring-icon" aria-hidden="true">
        {icon}
      </span>
    </div>
  );
}

function GameWorld({ running, paused, mutedRef, inputRef, onCrash, onHud, phase }) {
  const { state, pools, playerGroup } = useOjolSim({
    running,
    paused,
    mutedRef,
    inputRef,
    onCrash,
    onHud,
  });

  useEffect(() => {
    if (running) resetSim(state, pools);
  }, [running]); // eslint-disable-line

  return (
    <>
      <Cityscape phase={phase} stateRef={state} />
      <Road />
      <TrafficLight stateRef={state} />
      <group ref={playerGroup}>
        <Rider stateRef={state} />
      </group>
      <PooledWorld pools={pools} />
      <FollowCam playerGroup={playerGroup} stateRef={state} />
    </>
  );
}

export default function App() {
  const [screen, setScreen] = useState("menu"); // menu | how | play | over
  const [best, setBest] = useState(loadBest);
  const [soundOn, setSoundOn] = useState(loadSoundOn);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState({
    score: 0,
    dist: 0,
    coins: 0,
    speed: 0,
    shield: 0,
    magnet: 0,
    light: "green",
    phase: "day",
    shake: 0,
  });
  const [lastRun, setLastRun] = useState(null);
  const [runId, setRunId] = useState(0);

  const inputRef = useRef({ left: false, right: false, jump: false });
  const mutedRef = useRef(!soundOn);
  const touchRef = useRef({ x: 0, y: 0, t: 0 });

  useEffect(() => {
    window.__ojolBootClear?.();
  }, []);

  useEffect(() => {
    mutedRef.current = !soundOn;
    setMuted(!soundOn);
    saveSoundOn(soundOn);
    if (!soundOn) stopMusic();
  }, [soundOn]);

  const startRide = () => {
    sfx.click();
    setPaused(false);
    setLastRun(null);
    setRunId((n) => n + 1);
    setScreen("play");
    if (soundOn) startMusic();
  };

  const onCrash = useCallback((stats) => {
    stopMusic();
    const score = stats.score || 0;
    const nextBest = Math.max(best, score);
    if (nextBest > best) {
      setBest(nextBest);
      saveBest(nextBest);
    }
    setLastRun({ ...stats, best: nextBest });
    setScreen("over");
  }, [best]);

  // keyboard
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "a", "arrowright", "d", "arrowup", "w", " ", "p", "escape"].includes(k) || e.code === "Space") {
        e.preventDefault();
      }
      if (screen !== "play") return;
      if (k === "arrowleft" || k === "a") inputRef.current.left = true;
      if (k === "arrowright" || k === "d") inputRef.current.right = true;
      if (k === "arrowup" || k === "w" || k === " " || e.code === "Space") inputRef.current.jump = true;
      if (k === "p" || k === "escape") setPaused((v) => !v);
    };
    window.addEventListener("keydown", down, { passive: false });
    return () => window.removeEventListener("keydown", down);
  }, [screen]);

  // touch
  useEffect(() => {
    const el = document.getElementById("root");
    if (!el) return;
    const onStart = (e) => {
      const t = e.changedTouches[0];
      touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    };
    const onEnd = (e) => {
      if (screen !== "play" || paused) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchRef.current.x;
      const dy = t.clientY - touchRef.current.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < 24 && absY < 24) return;
      if (absX > absY) {
        if (dx < 0) inputRef.current.left = true;
        else inputRef.current.right = true;
      } else if (dy < 0) {
        inputRef.current.jump = true;
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [screen, paused]);

  const phase = hud.phase || "day";

  return (
    <div className={hud.shake > 0 && screen === "play" ? "ojol-shake" : ""} style={{ height: "100%" }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 4.2, 7.5], fov: 55, near: 0.1, far: 120 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        {screen === "play" || screen === "over" ? (
          <GameWorld
            key={runId}
            running={screen === "play"}
            paused={paused || screen === "over"}
            mutedRef={mutedRef}
            inputRef={inputRef}
            onCrash={onCrash}
            onHud={setHud}
            phase={phase}
          />
        ) : (
          <>
            <CityscapeLite />
            <hemisphereLight args={["#e8f4ff", "#6b7c6e", 0.7]} />
            <ambientLight intensity={0.55} />
            <directionalLight castShadow intensity={1.3} position={[10, 22, 8]} />
          </>
        )}
      </Canvas>

      <div className="ojol-ui">
        {screen === "menu" && (
          <div className="ojol-menu">
            <div className="ojol-card">
              <h1>Ojol Rush: Sudirman</h1>
              <p>Slip through Sudirman traffic. Don’t read the plate — feel the gap.</p>
              <p className="ojol-meta">Personal High Score: {best}</p>
              <div className="ojol-btn-row">
                <button type="button" className="ojol-btn" onClick={startRide}>
                  Start Ride
                </button>
                <button type="button" className="ojol-btn ghost" onClick={() => setScreen("how")}>
                  How to Play
                </button>
              </div>
              <button
                type="button"
                className="ojol-btn ghost"
                onClick={() => {
                  setSoundOn((v) => !v);
                  sfx.click();
                }}
              >
                Sound: {soundOn ? "On" : "Off"}
              </button>
              <a className="ojol-btn ghost" href="/#/games/solo">
                Back to Games
              </a>
            </div>
          </div>
        )}

        {screen === "how" && (
          <div className="ojol-menu">
            <div className="ojol-card">
              <h2>How to Play</h2>
              <ul className="ojol-howto">
                <li>Stay in 3 lanes — left, center, right.</li>
                <li>Desktop: A/D or arrows to switch · W/↑/Space jump · P pause.</li>
                <li>Mobile: swipe left/right to switch · swipe up to jump.</li>
                <li>Jump grey barriers, yellow cones, and holes. Avoid cars, buses, trucks.</li>
                <li>Watch for motors from behind — orange blink means someone’s overtaking.</li>
                <li>Power-ups: glowing blue Shield & big red Magnet (each lasts 10s).</li>
                <li>Yellow/red light = real traffic queues at the stop line. Slow for the jam, wait, then green go.</li>
                <li>Yellow blink on traffic = that vehicle is about to change lane.</li>
              </ul>
              <button type="button" className="ojol-btn" onClick={() => setScreen("menu")}>
                Got it
              </button>
            </div>
          </div>
        )}

        {screen === "play" && (
          <div className="ojol-hud">
            <div className="ojol-hud-top">
              <div className="ojol-hud-main">
                <div className="ojol-hud-primary">
                  <div className="ojol-score-block">
                    <span className="ojol-score-label">SCORE</span>
                    <span className="ojol-score-value">{hud.score}</span>
                  </div>
                  <div className="ojol-coin-block" aria-label={`${hud.coins} coins`}>
                    <span className="ojol-coin-ico" aria-hidden="true">
                      🪙
                    </span>
                    <span className="ojol-coin-value">{hud.coins}</span>
                  </div>
                </div>
                <div className="ojol-hud-meta">
                  <span>{hud.dist} m</span>
                  <span className="ojol-meta-dot" aria-hidden="true">
                    ·
                  </span>
                  <span>{hud.speed} km/h</span>
                  {(hud.light === "red" || hud.light === "yellow") && (
                    <>
                      <span className="ojol-meta-dot" aria-hidden="true">
                        ·
                      </span>
                      <span className={hud.light === "red" ? "ojol-light-red" : "ojol-light-yellow"}>
                        {hud.light === "red" ? "STOP" : "YELLOW"}
                      </span>
                    </>
                  )}
                </div>
                <div className="ojol-power-rings">
                  {hud.shield > 0 && (
                    <PowerRing
                      kind="shield"
                      icon="🛡"
                      label="Shield"
                      remain={hud.shield}
                      total={10}
                    />
                  )}
                  {hud.magnet > 0 && (
                    <PowerRing
                      kind="magnet"
                      icon="🧲"
                      label="Magnet"
                      remain={hud.magnet}
                      total={10}
                    />
                  )}
                </div>
              </div>
              <div className="ojol-hud-actions">
                <button
                  type="button"
                  className="ojol-icon-btn"
                  aria-label="Mute"
                  onClick={() => setSoundOn((v) => !v)}
                >
                  {soundOn ? "🔊" : "🔇"}
                </button>
                <button
                  type="button"
                  className="ojol-icon-btn"
                  aria-label="Pause"
                  onClick={() => setPaused((v) => !v)}
                >
                  {paused ? "▶" : "⏸"}
                </button>
              </div>
            </div>
            {paused && (
              <div className="ojol-overlay" style={{ background: "rgba(15,23,42,0.45)" }}>
                <div className="ojol-card">
                  <h2>Paused</h2>
                  <div className="ojol-btn-row">
                    <button type="button" className="ojol-btn" onClick={() => setPaused(false)}>
                      Resume
                    </button>
                    <button
                      type="button"
                      className="ojol-btn ghost"
                      onClick={() => {
                        stopMusic();
                        setScreen("menu");
                      }}
                    >
                      Quit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "over" && lastRun && (
          <div className="ojol-overlay">
            <div className="ojol-card">
              <h2>Ride Over!</h2>
              <p className="ojol-meta">Final score: {lastRun.score}</p>
              <p>Distance: {lastRun.dist} m</p>
              <p>Coins: {lastRun.coins}</p>
              <p>Near misses: {lastRun.nearMiss || 0}</p>
              <p className="ojol-meta">High score: {lastRun.best} 🏆</p>
              <div className="ojol-btn-row">
                <button type="button" className="ojol-btn" onClick={startRide}>
                  Ride Again
                </button>
                <button
                  type="button"
                  className="ojol-btn ghost"
                  onClick={() => setScreen("menu")}
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
