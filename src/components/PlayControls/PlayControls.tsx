/**
 * PlayControls component for battle playback control.
 * Provides Step, Play/Pause, and Reset buttons.
 */

import { useState, useEffect } from "react";
import {
  useGameStore,
  selectActions,
  selectBattleStatus,
} from "../../stores/gameStore";
import { useInterval } from "../../hooks/useInterval";
import styles from "./PlayControls.module.css";

const TICK_INTERVAL_MS = 1000; // 1 second between auto-play ticks

export function PlayControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const battleStatus = useGameStore(selectBattleStatus);
  const actions = useGameStore(selectActions);

  const isBattleActive = battleStatus === "active";

  // Auto-play tick advancement
  useInterval(
    () => {
      actions.processTick();
    },
    isPlaying ? TICK_INTERVAL_MS : null,
  );

  // Stop auto-play when battle ends
  useEffect(() => {
    if (!isBattleActive && isPlaying) {
      setIsPlaying(false);
    }
  }, [isBattleActive, isPlaying]);

  const handleStep = () => {
    actions.processTick();
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false); // Pause auto-play
    actions.reset();
  };

  return (
    <div
      className={styles.playControls}
      role="group"
      aria-label="Battle controls"
    >
      <button
        onClick={handleStep}
        disabled={!isBattleActive || isPlaying}
        aria-label="Step"
      >
        Step
      </button>
      <button
        onClick={handlePlayPause}
        disabled={!isBattleActive}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button onClick={handleReset} aria-label="Reset">
        Reset
      </button>
    </div>
  );
}
