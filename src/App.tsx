import { useEffect } from "react";
import { BattleViewer } from "./components/BattleViewer";
import { PlayControls } from "./components/PlayControls";
import { CharacterControls } from "./components/CharacterControls";
import { BattleStatusBadge } from "./components/BattleStatus";
import { SkillsPanel } from "./components/SkillsPanel";
import { RuleEvaluations } from "./components/RuleEvaluations";
import { ThemeToggle } from "./components/ThemeToggle";
import { useGameStore, selectActions } from "./stores/gameStore";
import { useAccessibilityStore } from "./stores/accessibilityStore";
import "./App.css";

function App() {
  const actions = useGameStore(selectActions);
  const showTargetLines = useAccessibilityStore((s) => s.showTargetLines);
  const setShowTargetLines = useAccessibilityStore((s) => s.setShowTargetLines);

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
          <ThemeToggle />
        </div>
      </div>
      <div className="gridContainer">
        <div className="battleViewer">
          <BattleViewer />
        </div>
        <div className="controls">
          <BattleStatusBadge />
          <CharacterControls />
          <PlayControls />
        </div>
        <div className="skillsPanel">
          <SkillsPanel />
        </div>
        <div className="ruleEvaluations">
          <RuleEvaluations />
        </div>
      </div>
    </div>
  );
}

export default App;
