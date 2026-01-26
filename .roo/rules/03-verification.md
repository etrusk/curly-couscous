# Verification

## Multi-Stage Quality Gates

Quality gates run at THREE points in the workflow:

1. **After test creation (Step 4):** Type-checking ensures tests compile
2. **After implementation (Step 6):** Lint + type-check catch issues before review
3. **Pre-commit (Step 11):** Husky hook runs lint-staged as final safety check

Catching issues early (Steps 4 & 6) prevents wasted review cycles.

### Full Quality Gate Suite

The complete quality gate suite includes:

```bash
npm run lint              # ESLint + Prettier (auto-fix)
npm run type-check        # TypeScript compilation
npm run test:critical     # Essential tests (< 30 seconds)
npm run security:scan     # Security vulnerability check
npm run build:verify      # Build verification
```

## Gate Pass = Verified

When all quality gates pass, the implementation is verified. No separate verification step is required.

## Gate Failure Protocol

If any gate fails:

1. Fix the issue before proceeding
2. Re-run the failing gate
3. Do not commit until all gates pass

## Scope of Verification

| Gate          | What It Verifies                                                              |
| ------------- | ----------------------------------------------------------------------------- |
| lint          | Code style, potential bugs, formatting, file size constraints (max 400 lines) |
| type-check    | Type safety, interface contracts                                              |
| test:critical | Core functionality, regressions                                               |
| security:scan | Known vulnerabilities, unsafe patterns                                        |
| build:verify  | Compilation, bundle integrity                                                 |
