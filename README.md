# Auto-Battler

A turn-based auto-battler game built with React and TypeScript.

## Getting Started

```bash
npm install
npm run dev
```

## Debugging

This project integrates with [Redux DevTools](https://github.com/reduxjs/redux-devtools) for state inspection and time-travel debugging.

### Setup

1. Install the Redux DevTools browser extension ([Chrome](https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/))
2. Start the dev server with `npm run dev`
3. Open your browser's DevTools (F12)
4. Navigate to the **Redux** tab

### Usage

Look for the store named **curly-couscous** in the Redux DevTools instance selector. From there you can:

- **Inspect state**: Browse the full state tree including game state, characters, and UI selections
- **Action history**: View a timeline of named actions (e.g., `initBattle`, `processTick`, `addCharacter`) with state diffs showing exactly what changed
- **Time-travel debugging**: Step backward and forward through action history to replay state transitions
