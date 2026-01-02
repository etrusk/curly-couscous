import { useEffect } from "react";
import { BattleViewer } from "./components/BattleViewer";
import { useGameStore, selectActions } from "./stores/gameStore";
import type { Character } from "./engine/types";

function App() {
  const actions = useGameStore(selectActions);

  useEffect(() => {
    // Create test characters for visual verification
    const testCharacters: Character[] = [
      // Friendly characters (circles)
      {
        id: "friendly-1",
        name: "Friendly 1",
        faction: "friendly",
        slotPosition: 0,
        hp: 100,
        maxHp: 100,
        position: { x: 2, y: 2 },
        skills: [],
        currentAction: null,
      },
      {
        id: "friendly-2",
        name: "Friendly 2",
        faction: "friendly",
        slotPosition: 1,
        hp: 50,
        maxHp: 100,
        position: { x: 3, y: 5 },
        skills: [],
        currentAction: null,
      },
      {
        id: "friendly-3",
        name: "Friendly 3",
        faction: "friendly",
        slotPosition: 2,
        hp: 20,
        maxHp: 100,
        position: { x: 1, y: 8 },
        skills: [],
        currentAction: null,
      },
      // Enemy characters (diamonds)
      {
        id: "enemy-1",
        name: "Enemy 1",
        faction: "enemy",
        slotPosition: 3,
        hp: 100,
        maxHp: 100,
        position: { x: 9, y: 2 },
        skills: [],
        currentAction: null,
      },
      {
        id: "enemy-2",
        name: "Enemy 2",
        faction: "enemy",
        slotPosition: 4,
        hp: 75,
        maxHp: 100,
        position: { x: 8, y: 6 },
        skills: [],
        currentAction: null,
      },
      {
        id: "enemy-3",
        name: "Enemy 3",
        faction: "enemy",
        slotPosition: 5,
        hp: 30,
        maxHp: 100,
        position: { x: 10, y: 9 },
        skills: [],
        currentAction: null,
      },
    ];

    actions.initBattle(testCharacters);
  }, [actions]);

  return (
    <div>
      <h1>Auto Battler</h1>
      <BattleViewer />
    </div>
  );
}

export default App;
