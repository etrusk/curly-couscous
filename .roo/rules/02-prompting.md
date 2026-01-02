# Prompting Guidelines

## Before Starting Work

If the request is vague, ask for:

- Specific file paths involved
- Function/method signatures expected
- Framework or library versions
- Patterns from existing code to follow
- Constraints (performance, compatibility, style)

## Don't Guess

If critical details are missing, ask — don't assume.
One clarifying question beats a wrong implementation.

## Context Placement (Attention Optimization)

LLMs exhibit "lost in the middle" bias—highest attention to first and last tokens.

**For long context operations:**

- Front-load: System prompts, project constraints, background docs
- Middle: Retrieved documents, sorted by relevance (most relevant last)
- End: Current task, specific question, actionable instructions

**Scratchpad Technique (36% error reduction):**
When processing long documents, instruct: "First, extract the 3-5 most relevant quotes, then answer based on those quotes."
