# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

UI/UX Visual Compliance Sweep -- Phase 1+2 complete, ready for commit. Phase 3 (Components) next. (TDD/Claude Code)

Note: `.tdd/` ephemeral files can be deleted at commit time -- Phase 1+2 tasks are complete.

## Recent Completions

- 2026-02-09: UI/UX Visual Compliance Sweep Phase 1+2 -- Token Foundation + Global Styles (COMPLETE, TDD/Claude Code) - Added 19 new terminal overlay CSS custom properties to all 3 theme blocks in `theme.css` (surfaces, borders, text, accent, status, radii, typography). Updated `index.css` font-family to `var(--font-mono)` and background to `var(--ground)`. Updated `App.css` with 6 rem-to-px conversions and h1 resize to 16px/700. Pure CSS changes, no tests needed. ADR-019 recorded. 3 files modified.

- 2026-02-08: Cleanup Session -- test split, DeathEvent dedup, Dash defaultTrigger (COMPLETE, TDD/Claude Code) - Split `selector-filter-integration.test.ts` (639 lines) into 3 files under 400-line limit. Fixed DeathEvent duplication on charge kills via pre-combat HP snapshot in `combat.ts`. Retrofitted Dash with `defaultTrigger: { scope: "enemy", condition: "in_range", conditionValue: 1 }`. 6 new test files, 2 source files modified. 29 new tests.

- 2026-02-08: Skill Expansion Session C -- Phases 7+8 (COMPLETE, TDD/Claude Code) - Added Kick (interrupt, tickCost 0, range 1, cooldown 4, instant) and Charge (charge, tickCost 1, range 3, damage 20, distance 3, cooldown 3). New action types `interrupt` and `charge` in all type unions. New event types: InterruptEvent, InterruptMissEvent, ChargeEvent. New engine modules: `interrupt.ts`, `charge.ts`. Pipeline order: Healing -> Interrupts -> Charges -> Movement -> Combat. Added `defaultTrigger`/`defaultFilter` to SkillDefinition. 12 source files modified, 6 new test files, 3 existing test files updated. 36 new tests, 1504/1504 passing.

## Priority Next Tasks (from TDD session)

- [ ] Fix undefined `--border-primary` token used 18x in CharacterPanel components but never defined in theme.css (found during: UI/UX Visual Compliance Sweep, date: 2026-02-08)

## Next Steps

- [ ] UI/UX Visual Compliance Sweep Phase 3: Component migration to terminal overlay tokens (per-component criteria in `.tdd/session.md`)
- [ ] Fix pre-existing TypeScript errors (TS18048 in charge-events.test, TS2532 in interrupt.test)
- [ ] ARIA semantics: `role="meter"` on HP bars, `aria-live="polite"` for battle status (debounced), `role="alert"` for victory/defeat/death events
- [ ] Update spec/architecture to reference WCAG 2.2 AA as accessibility target
- [ ] Upgrade React 18 → 19
- [ ] Adopt React Compiler (requires React 19)
- [ ] CSS theming functions: `light-dark()` for unified theme switching, `color-mix()` for opacity variants (whiff, cooldown)
- [ ] Set up Vitest Browser Mode config for SVG/component test subset
