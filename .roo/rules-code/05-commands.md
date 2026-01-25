# Command Execution Rules

## Project Root Execution

**All commands automatically execute in the project root** (`/home/bob/Projects/auto-battler`).

You do NOT need to `cd` into the project directory before running commands.

## Never

- `cd /home/bob/Projects/auto-battler && npm test` ❌
- `cd ~/Projects/auto-battler && npm run lint` ❌

## Always

- `npm test` ✅
- `npm run lint` ✅
- `git add -A && echo "DONE"` ✅

## Working Directory

The VSCode terminal already has the correct working directory set. Just run the command directly.

## Exception: Outside Project Directory

If you need to execute a command in a directory OUTSIDE the project root (rare), then `cd` is appropriate:

```bash
cd /some/other/path && command
```

But for this project's files, commands, and scripts — never prepend `cd`.
