# Tool Usage Rules (MANDATORY)

## HARD CONSTRAINT

NEVER use execute_command for file reading, searching, or listing operations.
ALWAYS use native Roo tools: read_file, search_files, list_files, list_code_definition_names.
This is non-negotiable. Violations waste tokens and bypass .rooignore protections.

## Native Tools Over Shell Commands

| Operation      | Shell (❌)            | Native (✅)                  |
| -------------- | --------------------- | ---------------------------- |
| Read file      | `cat`, `head`, `tail` | `read_file`                  |
| Search         | `grep`, `ag`, `rg`    | `search_files`               |
| List files     | `ls`, `find`, `tree`  | `list_files`                 |
| Code structure | regex for defs        | `list_code_definition_names` |

**Why:** Token efficiency, auto-truncation, .rooignore protection, PDF/DOCX support.

## When execute_command IS Appropriate

- Dependencies: `npm install`, `pip install`, `cargo add`
- Build: `npm run build`, `make`, `cargo build`
- Tests: `npm test`, `pytest`, `go test`
- Git: `git add`, `git commit`, `git push`
- Servers: `npm start` (check if `npm run dev` already running)
- Linting: `eslint`, `prettier`, `ruff`

## Command Suffix Rule (MANDATORY)

**ALWAYS append `&& echo "DONE"` to every `execute_command` invocation.**

Examples: `npm run lint && echo "DONE"`, `git add -A && echo "DONE"`

No exceptions.
