# Lesson 3: Verify CSS variable semantics across all theme modes

**Date:** 2026-01-29

**Context:** The plan specified `--surface-elevated` for tooltip backgrounds based on the theme.css comment ("tooltips, overlays, damage numbers"). During browser verification, the tooltip rendered with a white background in dark mode because `--surface-elevated` is set to `#ffffff` in both modes (intended for damage number overlays that always need white backgrounds).

**Lesson:** CSS variable names can be misleading. Always verify the actual values of CSS variables across all theme modes (light and dark) before using them. The semantic name "elevated" suggested floating UI elements, but the actual values were designed for a specific use case (damage overlays) that requires a constant white background. Use `--surface-primary` for theme-aware backgrounds that should adapt to light/dark modes.

**Impact:** Without browser verification, this would have shipped with broken dark mode styling. The fix was simple (swap one CSS variable) but required human visual testing to catch.
