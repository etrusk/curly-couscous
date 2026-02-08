# Dependency Freshness Check & Update

Run a three-tier dependency update gated by the project's quality checks.

## Setup

Snapshot `package.json` and `package-lock.json` before starting:

```bash
cp package.json package.json.bak
cp package-lock.json package-lock.json.bak
```

## Tier 1 — Patch Updates

Apply all available patch updates in a single batch:

```bash
npx npm-check-updates --target patch -u
npm install
npm test && npm run type-check && npm run lint
```

If any gate fails, restore from backup and report:

```bash
cp package.json.bak package.json
cp package-lock.json.bak package-lock.json
npm install
```

If Tier 1 succeeded, snapshot again for Tier 2:

```bash
cp package.json package.json.bak
cp package-lock.json package-lock.json.bak
```

## Tier 2 — Minor Updates (Grouped)

Process minor updates in groups. For each group: apply, install, run quality gates. Revert the group if any gate fails. Snapshot after each successful group.

**Group order:**

1. **Testing libs**: `@testing-library/*`, `vitest`, `jsdom`
2. **ESLint ecosystem**: `eslint`, `eslint-plugin-*`, `typescript-eslint`
3. **Build tools**: `vite`, `@vitejs/*`
4. **Remaining runtime deps**: one package at a time

For each group:

```bash
# Snapshot before group
cp package.json package.json.bak
cp package-lock.json package-lock.json.bak

# Apply minor updates for this group (example for testing libs)
npx npm-check-updates --target minor -f "@testing-library/*,vitest,jsdom" -u
npm install
npm test && npm run type-check && npm run lint

# If gates fail, revert this group:
cp package.json.bak package.json
cp package-lock.json.bak package-lock.json
npm install
```

For remaining runtime deps (group 4), identify them first:

```bash
npx npm-check-updates --target minor
```

Then update each remaining package individually with the same snapshot/gate/revert pattern.

## Tier 3 — Major Updates (Report Only)

List available major updates but do NOT apply them:

```bash
npx npm-check-updates --target major
```

Report package names and version ranges. Never auto-apply major updates.

## Post-Update

### Security Audit

```bash
npm audit
```

Report any new vulnerabilities.

### Update Timestamp

```bash
date -u +%Y-%m-%dT%H:%M:%SZ > .deps-check-timestamp
```

### Cleanup

```bash
rm -f package.json.bak package-lock.json.bak
```

### Summary

Present a structured summary:

- **Applied patches**: list packages and version changes
- **Applied minors**: list packages and version changes
- **Reverted minors**: list packages and reason (which gate failed)
- **Available majors**: list packages with current → available version
- **Security status**: audit results

### Commit

Commit with a descriptive message listing what was updated/reverted. Use `chore` type (not feat/fix). Do not bump the version in `package.json`. Example:

```
chore(deps): update patch (react-dom 18.2.1→18.2.3, vitest 4.0.1→4.0.5) and minor (zustand 4.4→4.5)

Reverted: eslint 9.39→9.40 (lint gate failed)
```
