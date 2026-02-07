import { useEffect } from "react";
import { BattleViewer } from "./components/BattleViewer";
import { PlayControls } from "./components/PlayControls";
import { CharacterControls } from "./components/CharacterControls";
import { BattleStatusBadge } from "./components/BattleStatus";
import { CharacterPanel } from "./components/CharacterPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { useGameStore, selectActions } from "./stores/gameStore";
import "./App.css";

function App() {
  const actions = useGameStore(selectActions);

  useEffect(() => {
    // Initialize with empty arena for pre-battle character setup
    actions.initBattle([]);
  }, [actions]); // Initialize once on mount

  return (
    <div className="app">
      <div className="header">
        <h1>Auto Battler</h1>
        <div className="headerControls">
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
        <div className="characterPanel">
          <CharacterPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
