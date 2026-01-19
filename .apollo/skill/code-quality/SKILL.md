---
name: code-quality
description: Use when writing, reviewing, or improving code quality. Triggers on "clean code", "refactor", "code review", "best practices", "improve this code".
---

# Code Quality Standards

## Naming
- Variables: descriptive, camelCase (JS/TS) or snake_case (Python)
- Functions: verb + noun (getUserData, calculateTotal)
- Booleans: is/has/can prefix (isActive, hasPermission)
- Constants: SCREAMING_SNAKE_CASE

## Functions
- Single responsibility (do one thing well)
- Max 20-30 lines (extract if longer)
- Max 3-4 parameters (use object if more)
- Return early to avoid deep nesting

## Error Handling
- Fail fast with clear messages
- Handle errors at the right level
- Never swallow errors silently
- Include context in error messages

## Comments
- Explain "why", not "what"
- No commented-out code
- Keep comments updated with code
- Use JSDoc/docstrings for public APIs

## Code Smells to Avoid
- Magic numbers → use named constants
- Deep nesting → extract functions, return early
- Long parameter lists → use objects
- Duplicate code → extract to function
- God functions → split by responsibility

## Before Submitting Code
1. Does it work?
2. Is it readable?
3. Is it minimal? (no extra code)
4. Are edge cases handled?
5. Are errors handled gracefully?
