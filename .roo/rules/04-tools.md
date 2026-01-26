# Tool Usage Rules (MANDATORY)

## HARD CONSTRAINT

NEVER use execute_command for file reading, searching, or listing operations.
ALWAYS use native Roo tools: read_file, search_files, list_files, list_code_definition_names.
This is non-negotiable. Violations waste tokens and bypass .rooignore protections.

## Native Tools Over Shell Commands

Use Roo's built-in tools instead of `execute_command` for file operations.
Native tools are token-optimized, provide line numbers, and respect `.rooignore`.

### File Reading

| Instead of              | Use                                                |
| ----------------------- | -------------------------------------------------- |
| `cat file.py`           | `read_file` with `path` parameter                  |
| `head -n 50 file.py`    | `read_file` with `start_line=1, end_line=50`       |
| `tail -n 20 file.py`    | `read_file` with negative or calculated line range |
| `cat file1.py file2.py` | `read_file` with multiple files via `args` format  |

### Pattern Search

| Instead of                  | Use                                                     |
| --------------------------- | ------------------------------------------------------- |
| `grep -r "pattern" .`       | `search_files` with `regex` parameter                   |
| `grep -n "pattern" file.py` | `search_files` scoped to specific path                  |
| `ag`, `rg`, `ack`           | `search_files` or `codebase_search` for semantic search |

### Directory Listing

| Instead of            | Use                                              |
| --------------------- | ------------------------------------------------ |
| `ls -la`              | `list_files` with `path` parameter               |
| `find . -name "*.py"` | `list_files` with `recursive=true`               |
| `tree`                | `list_files` (provides 2-level depth by default) |

### Code Structure

| Instead of               | Use                                                  |
| ------------------------ | ---------------------------------------------------- | ------------------- | ---------------------------- |
| `grep -E "^(class        | def                                                  | function)" file.py` | `list_code_definition_names` |
| Custom regex for imports | `list_code_definition_names` for structural overview |

## When execute_command IS Appropriate

Use `execute_command` only for actual system operations:

- Installing dependencies: `npm install`, `pip install`, `cargo add`
- Build/compile: `npm run build`, `make`, `cargo build`
- Running tests: `npm test`, `pytest`, `go test`
- Git operations: `git add`, `git commit`, `git push`, `git status`
- Starting servers: `npm start`, `python -m http.server` (**Note:** Check if `npm run dev` is already running before starting)
- Package management: `npm audit`, `pip-audit`, `cargo audit`
- Linting/formatting: `eslint`, `prettier`, `black`, `ruff`

## Command Suffix Rule (MANDATORY)

**ALWAYS append `&& echo "DONE"` to every `execute_command` invocation.**

This ensures terminal completion detection in VS Code.

**Examples:**

- `npm run lint && echo "DONE"`
- `git add -A && echo "DONE"`
- `npm test && echo "DONE"`

No exceptions.

## Why This Matters

1. **Token efficiency**: `read_file` output is structured with line numbers; shell output wastes tokens
2. **Auto-truncation**: Native tools respect token budgets and truncate intelligently
3. **Security**: `.rooignore` fully protects native tools; shell has limited coverage
4. **Concurrent reads**: `read_file` supports batch operations for multiple files
5. **Error handling**: Native tools recover gracefully from stream errors and large files
6. **PDF/DOCX support**: `read_file` extracts text from documents; shell cannot

## Pre-Operation Check

Before using `execute_command` for any file operation, ask:
→ "Is there a native Roo tool that does this better?"
→ If yes, use the native tool
→ If uncertain, use the native tool

## Never

- Use `cat` to read files when `read_file` is available
- Use `grep` to search when `search_files` is available
- Use `ls` or `find` to list files when `list_files` is available
- Chain shell commands for operations native tools handle natively
- Bypass `.rooignore` restrictions via shell commands
