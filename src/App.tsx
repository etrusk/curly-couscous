import { useEffect } from "react";
import { BattleViewer } from "./components/BattleViewer";
import { PlayControls } from "./components/PlayControls";
import { useGameStore, selectActions } from "./stores/gameStore";
import type { Character, Skill, Action } from "./engine/types";

function App() {
  const actions = useGameStore(selectActions);

  useEffect(() => {
    // Define test skills for visual verification
    const lightPunch: Skill = {
      id: "light-punch",
      name: "Light Punch",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    };

    const heavyPunch: Skill = {
      id: "heavy-punch",
      name: "Heavy Punch",
      tickCost: 2,
      range: 1,
      damage: 25,
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    };

    const moveTowards: Skill = {
      id: "move-towards",
      name: "Move Towards",
      tickCost: 1,
      range: 1,
      mode: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    };

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
        skills: [lightPunch],
        currentAction: null, // Will be set manually below
      },
      {
        id: "friendly-2",
        name: "Friendly 2",
        faction: "friendly",
        slotPosition: 1,
        hp: 50,
        maxHp: 100,
        position: { x: 3, y: 5 },
        skills: [moveTowards],
        currentAction: null, // Will be set manually below
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
        skills: [heavyPunch],
        currentAction: null, // Will be set manually below
      },
      {
        id: "enemy-2",
        name: "Enemy 2",
        faction: "enemy",
        slotPosition: 4,
        hp: 75,
        maxHp: 100,
        position: { x: 8, y: 6 },
        skills: [moveTowards],
        currentAction: null, // Will be set manually below
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

    // Manually set pending actions for intent line visualization
    // Get character references for type safety (using non-null assertions since we control the array)
    const friendly1 = testCharacters[0]!;
    const friendly2 = testCharacters[1]!;
    const enemy1 = testCharacters[3]!;
    const enemy2 = testCharacters[4]!;

    // Friendly-1: Attack action (solid blue line) targeting enemy-1
    const attackAction1: Action = {
      type: "attack",
      skill: lightPunch,
      targetCell: { x: 9, y: 2 }, // enemy-1 position
      targetCharacter: null, // Avoid circular reference
      startedAtTick: 0,
      resolvesAtTick: 0, // Resolves this tick (1-tick skill)
    };
    friendly1.currentAction = attackAction1;

    // Friendly-2: Move action (dashed blue line) towards enemy-2
    const moveAction1: Action = {
      type: "move",
      skill: moveTowards,
      targetCell: { x: 4, y: 5 }, // One step towards enemy-2
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0, // Resolves this tick
    };
    friendly2.currentAction = moveAction1;

    // Enemy-1: Attack action (solid orange line) targeting friendly-1
    const attackAction2: Action = {
      type: "attack",
      skill: heavyPunch,
      targetCell: { x: 2, y: 2 }, // friendly-1 position
      targetCharacter: null, // Avoid circular reference
      startedAtTick: 0,
      resolvesAtTick: 1, // Resolves next tick (2-tick skill = locked-in with glow)
    };
    enemy1.currentAction = attackAction2;

    // Enemy-2: Move action (dashed orange line) towards friendly-2
    const moveAction2: Action = {
      type: "move",
      skill: moveTowards,
      targetCell: { x: 7, y: 6 }, // One step towards friendly-2
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0, // Resolves this tick
    };
    enemy2.currentAction = moveAction2;

    actions.initBattle(testCharacters);
  }, [actions]); // Initialize once on mount

  return (
    <div>
      <h1>Auto Battler</h1>
      <PlayControls />
      <BattleViewer />
    </div>
  );
}

export default App;
