# Pre-Implementation Verification

## Before Writing Code

For any function, method, or API you're about to use:

1. **Have I seen it?** If referencing a method/class, confirm it exists in files I've read this session
2. **Package check**: If importing a package, verify it's in package.json/requirements.txt/go.mod
3. **Version check**: If using version-specific syntax, confirm the version in project config

## If Uncertain

→ Use `search_files` or `read_file` to verify before proceeding
→ If still uncertain, ask: "I want to use [X] but haven't confirmed it exists. Should I search for it?"

## Never

- Invent convenience methods that "should" exist
- Assume a package is installed without checking
- Reference documentation from memory without verification
