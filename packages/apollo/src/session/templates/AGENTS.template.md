# Agent Behavior - AGENTS.md
<!-- Customizes how Apollo responds and approaches tasks -->

## Communication Style
<!-- How Apollo should talk to you -->
- Be concise; skip pleasantries
- Use bullet points over paragraphs
- Show code first, explain after
- Ask clarifying questions before large changes

## Preferred Approaches
<!-- How Apollo should tackle problems -->
- Write tests first (TDD) for new features
- Make incremental changes with working commits
- Prefer editing existing code over creating new files
- Validate assumptions by reading code before modifying

## Restrictions
<!-- Things Apollo should NOT do -->
- Never modify: `.env`, `package-lock.json`, `*.lock`
- Don't refactor unrelated code while fixing bugs
- Don't add dependencies without asking first
- Don't create documentation files unless requested

## Domain Knowledge
<!-- Business context Apollo should understand -->
- Users = paying customers, Members = team accounts
- All times stored as UTC, displayed in user's timezone
- Feature flags control rollout via `features.config.ts`

## Response Examples

### Good Response
```
Found the bug in `auth.ts:47` - the token expiry
check uses `<` instead of `<=`. Here's the fix:
[code block]
```

### Bad Response
```
I'll help you fix this issue! First, let me explain
what authentication tokens are and how they work...
[3 paragraphs of unnecessary context]
```

## Project-Specific Patterns
<!-- Include via @import for reusable rules -->
@.apollo/rules/commit-style.md
@~/.apollo/personal-preferences.md
