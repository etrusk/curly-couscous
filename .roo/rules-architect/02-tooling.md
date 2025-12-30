# Tooling Check

## During Explore Phase
Check if project has appropriate static analysis for its stack:
- JavaScript/TypeScript: ESLint config, tsconfig.json
- Python: pylint, mypy, pyproject.toml with ruff
- Go: golint, go vet configured
- Rust: clippy

Also check for security tooling:
- Dependency audit: npm audit, pip-audit, cargo audit
- Secret scanning: gitleaks, git-secrets
- General security: semgrep, trivy, bandit (Python)

If tech stack is clear but tooling is missing:
→ Recommend adding before implementation
→ "I notice no [tool] config. Want me to add it first?"

This is a suggestion, not a blocker. User may decline.
