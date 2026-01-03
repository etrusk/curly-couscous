# Proven Patterns

This file documents implementation patterns that have been successfully applied in this codebase.

## Format

For each pattern, include:

- **Pattern Name**: Brief, descriptive name
- **Context**: When to use this pattern
- **Implementation**: Code example or approach
- **Rationale**: Why this pattern works well for this project
- **Related Files**: Where this pattern is used

## Patterns

<!-- PULSE: [2026-01-03] architect - Adding first UI pattern for RuleEvaluations enhancement -->

### Collapsible Section Pattern

**Context**: When content should be hidden by default but accessible on demand. Use for progressive disclosure of secondary information.

**Implementation**:

```tsx
// Use native <details>/<summary> HTML elements
<details className={styles.collapsedSection}>
  <summary className={styles.collapsedSummary}>Show {count} more items</summary>
  <div className={styles.collapsedContent}>{/* Hidden content here */}</div>
</details>
```

**CSS Pattern**:

```css
.collapsedSection {
  margin-top: 0.5rem;
  border: 1px dashed var(--border-subtle);
  border-radius: 4px;
}

.collapsedSummary {
  padding: 0.5rem;
  cursor: pointer;
  color: var(--content-secondary);
  font-size: 0.75rem;
  user-select: none;
  list-style: none; /* Remove default marker */
}

.collapsedSummary::before {
  content: "▶ ";
  display: inline-block;
  transition: transform 0.2s ease;
}

.collapsedSection[open] > .collapsedSummary::before {
  transform: rotate(90deg);
}

/* Accessibility: visible focus ring */
.collapsedSummary:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .collapsedSummary::before {
    transition: none;
  }
}
```

**Rationale**:

- Accessible by default (keyboard Enter/Space, screen reader announces state)
- No JavaScript required for toggle behavior
- Progressive enhancement (works without JS)
- Semantic HTML conveys purpose

**Accessibility Notes**:

- Native `<summary>` is focusable and activates with Enter/Space
- Screen readers announce "disclosure triangle, collapsed/expanded"
- Use `:focus-visible` (not `:focus`) to avoid focus ring on click
- Custom `::before` chevron provides visual state indicator

**Related Files**:

- `src/components/RuleEvaluations/RuleEvaluations.tsx` (first usage)
- `src/components/RuleEvaluations/RuleEvaluations.module.css`
