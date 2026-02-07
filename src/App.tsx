import { useEffect } from "react";
import { BattleViewer } from "./components/BattleViewer";
import { PlayControls } from "./components/PlayControls";
import { CharacterControls } from "./components/CharacterControls";
import { BattleStatusBadge } from "./components/BattleStatus";
import { CharacterPanel } from "./components/CharacterPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { useGameStore, selectActions } from "./stores/gameStore";
import { useAccessibilityStore } from "./stores/accessibilityStore";
import "./App.css";

function App() {
  const actions = useGameStore(selectActions);
  const showTargetLines = useAccessibilityStore((s) => s.showTargetLines);
  const setShowTargetLines = useAccessibilityStore((s) => s.setShowTargetLines);
  const autoFocus = useAccessibilityStore((s) => s.autoFocus);
  const setAutoFocus = useAccessibilityStore((s) => s.setAutoFocus);
  const battleStatus = useGameStore((state) => state.gameState.battleStatus);
  const characters = useGameStore((state) => state.gameState.characters);

  // Determine UI phase for grid proportions
  const isBattlePhase =
    autoFocus && battleStatus === "active" && characters.length > 0;

  useEffect(() => {
    // Initialize with empty arena for pre-battle character setup
    actions.initBattle([]);
  }, [actions]); // Initialize once on mount

  return (
    <div className="app">
      <div className="header">
        <h1>Auto Battler</h1>
        <div className="headerControls">
          <label htmlFor="show-targeting-lines" className="toggleLabel">
            <input
              id="show-targeting-lines"
              type="checkbox"
              checked={showTargetLines}
              onChange={(e) => setShowTargetLines(e.target.checked)}
              aria-describedby="targeting-lines-description"
            />
            Show targeting lines
          </label>
          <span id="targeting-lines-description" className="visuallyHidden">
            Toggle visibility of movement target lines on the battle grid
          </span>
          <button
            role="switch"
            aria-checked={autoFocus}
            onClick={() => setAutoFocus(!autoFocus)}
            aria-describedby="auto-focus-description"
            className={`pillSwitch ${autoFocus ? "pillSwitchOn" : ""}`}
          >
            Auto-focus battle
          </button>
          <span id="auto-focus-description" className="visuallyHidden">
            Automatically expand battle view when battle starts
          </span>
          <ThemeToggle />
        </div>
      </div>
      <div
        className="gridContainer"
        data-phase={isBattlePhase ? "battle" : "config"}
      >
        <div className="battleViewer">
          <BattleViewer />
        </div>
        <div className="controls">
          <BattleStatusBadge />
          <CharacterControls />
          <PlayControls />
        </div>
        <div className="characterPanel">
          <CharacterPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
