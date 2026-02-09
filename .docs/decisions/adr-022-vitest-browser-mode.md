# ADR-022: Vitest Browser Mode for Real DOM Testing

**Date**: 2026-02-09
**Status**: Accepted

## Decision

Use Vitest Browser Mode with Playwright for tests that require real browser DOM/SVG rendering, running alongside existing jsdom unit tests in a two-project workspace configuration.

## Context

Several component behaviors cannot be accurately tested with jsdom:

- `getBoundingClientRect()` always returns zero-dimension rects in jsdom, requiring hardcoded fallback values in tooltip positioning logic
- `getComputedStyle()` does not resolve CSS Module values in jsdom
- SVG geometry (bounding boxes for `<g>` elements) is not computed in jsdom
- Viewport constraint behavior (overflow, clamping) cannot be validated without a real rendering engine

The CharacterTooltip component has a zero-rect workaround (fallback to 300x150 assumed dimensions) specifically because jsdom cannot provide real element geometry.

## Options Considered

1. **Continue mocking** - Keep jsdom with manual mocks for getBoundingClientRect. Pro: no new infrastructure. Con: mocks can drift from reality, positioning bugs slip through.
2. **Vitest Browser Mode for subset** - Run only positioning/geometry tests in a real browser. Pro: integrates with existing Vitest workflow, minimal overhead. Con: requires Playwright + Chromium, browser tests are slower.
3. **Separate E2E framework (Cypress/Playwright Test)** - Full E2E tests for visual behaviors. Pro: battle-tested tools. Con: separate test runner, different API, heavy infrastructure for unit-level positioning tests.

## Decision Rationale

Option 2 provides the best tradeoff. Browser Mode runs within the existing Vitest ecosystem (same assertions, same config, same CLI), targets only the tests that genuinely need real rendering, and avoids the overhead of a separate E2E framework. The `.browser.test.tsx` naming convention makes the boundary clear.

## Implementation

- **Workspace config**: `vite.config.ts` uses `test.projects` with two projects (`unit` and `browser`), both using `extends: true` to inherit plugins and CSS config
- **File convention**: Browser tests use `.browser.test.tsx` suffix, co-located with their component
- **Setup file**: `src/test/setup.browser.ts` omits the `matchMedia` mock (real browser has native support)
- **Browser provider**: Playwright with Chromium in headless mode
- **npm scripts**: `test:unit` (jsdom only), `test:browser` (browser only), `test` (both)

## Consequences

- **Positive**: Real DOM geometry validation, catches positioning bugs that jsdom misses, same test API as unit tests
- **Negative**: Requires Playwright + Chromium in CI (`npx playwright install chromium`), browser tests are slower (~seconds vs milliseconds), two test projects to maintain
- **Convention**: New browser tests use `.browser.test.tsx` suffix; existing jsdom tests are not migrated
- **Follow-up (resolved)**: Phase 2 browser tests validated real SVG geometry and tooltip positioning. Zero-rect fallback removed from CharacterTooltip.tsx. `calculateTooltipPosition` extracted to `tooltip-positioning.ts` for direct unit testing. Phase 3 added CSS variable resolution tests (light-dark, color-mix, cascade) and Token visual feedback tests (selection glow, animation, focus-visible, HP bar). 22 browser tests total (4 Phase 1 + 6 Phase 2 + 12 Phase 3)
