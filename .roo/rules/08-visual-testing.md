# Visual Testing Rules

## When to Use Browser Tool

Use `browser_action` for visual verification when changes affect:

- React components (`.tsx` files in `src/components/`)
- CSS/styling (`.css`, `.module.css` files)
- Layout or visual structure
- Accessibility features (colors, contrast, shapes)

## Verification Flow

1. **Launch**: `browser_action` with `launch` to open dev server URL
2. **Navigate**: Go to affected view/component
3. **Verify**: Check visual elements match expectations
4. **Screenshot**: Capture state if issues found for handback
5. **Close**: `browser_action` with `close` when complete

## Integration with Workflow

- **Step 9b (VISUAL VERIFY)**: Mandatory for UI changes before commit
- **Debug mode**: Use for investigating visual discrepancies
- **Budget**: Browser actions count toward exchange limits (plan accordingly)

## No Human Approval Needed

Automated visual verification is part of standard workflow. Take screenshots to document issues, but don't block for human review unless critical accessibility violations found.
