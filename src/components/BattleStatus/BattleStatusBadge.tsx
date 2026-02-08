/**
 * BattleStatusBadge component displays current battle status and tick count.
 * Provides visual feedback for battle state with accessibility support.
 */

import {
  useGameStore,
  selectBattleStatus,
  selectTick,
} from "../../stores/gameStore";
import styles from "./BattleStatusBadge.module.css";

interface StatusConfig {
  text: string;
  emoji: string;
  className: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  active: {
    text: "Battle Active",
    emoji: "⚔️",
    className: styles.statusActive || "",
  },
  victory: {
    text: "Victory!",
    emoji: "✓",
    className: styles.statusVictory || "",
  },
  defeat: {
    text: "Defeat",
    emoji: "✗",
    className: styles.statusDefeat || "",
  },
  draw: {
    text: "Draw",
    emoji: "≈",
    className: styles.statusDraw || "",
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  text: "Unknown",
  emoji: "?",
  className: styles.statusUnknown || "",
};

/** Terminal battle statuses that trigger assertive screen reader announcement */
const TERMINAL_STATUSES = new Set(["victory", "defeat", "draw"]);

export function BattleStatusBadge() {
  const battleStatus = useGameStore(selectBattleStatus);
  const tick = useGameStore(selectTick);

  // Defensive rendering: handle unexpected status values
  const config = STATUS_CONFIG[battleStatus] || FALLBACK_CONFIG;
  const isTerminal = TERMINAL_STATUSES.has(battleStatus);

  return (
    <div className={`${styles.badge} ${config.className}`}>
      <div className={styles.statusContainer} aria-live="polite">
        <span aria-hidden="true" className={styles.emoji}>
          {config.emoji}
        </span>
        <span className={styles.statusText} data-testid="battle-status">
          {config.text}
        </span>
      </div>
      <div role="alert" className={styles.srOnly}>
        {isTerminal ? config.text : ""}
      </div>
      <div className={styles.tickDisplay} data-testid="tick-display">
        Tick: {tick}
      </div>
    </div>
  );
}
