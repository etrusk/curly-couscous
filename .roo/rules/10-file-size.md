# File Size Constraints

## Workspace-wide Rule

Files must not exceed 400 lines (excluding blanks and comments).

**Rationale**: Large files degrade AI performance and reduce code maintainability. 400 lines is conservative—Clean Code allows up to 500, but we enforce stricter limits for optimal AI context usage.

## Enforcement Protocol

### ESLint Configuration

The ESLint rule `max-lines` is configured as:

- Error level at 400 lines
- Skips blanks and comments
- Applies to all TypeScript and JavaScript files

### Workflow Integration

When lint reports a `max-lines` error:

1. **STOP** current work immediately
2. **Switch to Architect mode** to design decomposition
3. **Implement** the file split according to Architect's design
4. **Resume** original task after decomposition is complete

### Decomposition Guidelines

Architect mode should design decomposition that:

- Preserves single responsibility principle
- Creates logical boundaries between extracted components/functions
- Maintains test coverage
- Follows existing project patterns
- Keens new files under 300 lines for future growth

### Exceptions

Configuration files (`.config.ts`, `.config.js`, `eslint.config.js`, `vite.config.ts`) are exempt from this rule as they often require longer setup.

### Verification

File size is included in the lint gate scope (see `.roo/rules/03-verification.md`). The lint gate must pass before any commit.
