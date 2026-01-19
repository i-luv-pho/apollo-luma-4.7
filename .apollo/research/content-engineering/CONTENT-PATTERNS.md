# Content Engineering Patterns

## Writing Patterns for AI Output

### 1. The Pyramid Principle

Start with the conclusion, then support with evidence.

**Before (Bottom-up)**
```
I analyzed the logs and found 3 errors.
The first error was a null pointer at line 45.
The second was a timeout at line 78.
The third was a missing import.
The null pointer is the root cause.
```

**After (Top-down)**
```
Root cause: Null pointer at line 45.

Supporting evidence:
- Timeout at line 78 (downstream effect)
- Missing import (unrelated)
```

### 2. STAR Method for Responses

```markdown
**Situation**: [What user asked / context]
**Task**: [What you'll do]
**Action**: [The work / code / explanation]
**Result**: [Outcome + next steps]
```

### 3. Progressive Disclosure

Layer information by importance:

```markdown
## TL;DR
[1-2 sentence summary]

## Details
[Full explanation]

## Deep Dive (if needed)
[Technical details, edge cases]
```

## Structure Templates

### Bug Fix Response
```markdown
**Issue**: [Brief description]
**Cause**: [Root cause in 1 line]
**Fix**: [Solution]

**Location**: `file:line`

**Changes**:
- Before: `old code`
- After: `new code`

**Verification**: [How to test]
```

### Feature Implementation
```markdown
## Summary
[What was built in 1-2 sentences]

## Changes
| File | Change |
|------|--------|
| `path/file.ts` | Added X function |
| `path/other.ts` | Modified Y |

## Usage
```code example```

## Next Steps
- [ ] Test edge case X
- [ ] Update documentation
```

### Code Explanation
```markdown
## What This Does
[1 sentence purpose]

## How It Works
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Key Parts
- `functionName()`: [purpose]
- `variableName`: [what it holds]

## Example
```code```
```

## Output Formatting

### Headers Hierarchy
```markdown
# Task/Topic (one per response)
## Major Section
### Subsection
#### Detail (rarely needed)
```

### Lists
- Use bullets for unordered items (3-7 items)
- Use numbers for sequential steps
- Use tables for comparing options

### Code Blocks
```markdown
```language
// Always specify language
// Keep under 30 lines
// Add comments for complex logic
```
```

### File References
```markdown
Location: `src/components/Button.tsx:45`
See also: `utils/helpers.ts:12-28`
```

## Tone Patterns

### Confident but Not Arrogant
```
Good: "The issue is X because Y"
Bad:  "I think maybe it could be X"
Bad:  "Obviously the issue is X"
```

### Direct Action Language
```
Good: "Change line 45 to..."
Bad:  "You might want to consider changing..."
Bad:  "It would be advisable to modify..."
```

### Acknowledge Uncertainty
```
Good: "I'm 80% confident this is correct. Let me verify by..."
Good: "This should work, but test edge case X"
Bad:  "I don't know" (without next steps)
```

## Anti-Patterns to Avoid

### 1. Wall of Text
**Bad**: Long paragraphs without breaks
**Good**: Short paragraphs, bullets, headers

### 2. Buried Lead
**Bad**: Explanation → Explanation → Answer
**Good**: Answer → Supporting Details

### 3. Over-Hedging
**Bad**: "Perhaps you might consider possibly looking at..."
**Good**: "Check line 45"

### 4. Redundant Preambles
**Bad**: "Great question! Let me help you with that."
**Good**: [Just answer]

### 5. Unnecessary Caveats
**Bad**: "Note that this may vary depending on..."
**Good**: [Specific answer for their context]

## Context-Specific Patterns

### Debugging Output
```
🔍 INVESTIGATING: [brief]
📍 LOCATION: file:line
💡 HYPOTHESIS: [what + why]
✅ CONFIRMED / ❌ DISPROVED
🔧 FIX: [solution]
```

### Code Review Output
```
## Summary
[Overall assessment]

## Issues
### Critical
- [issue + fix]

### Suggestions
- [nice-to-have]

## Approved / Changes Requested
```

### Planning Output
```
## Goal
[What we're building]

## Approach
1. [Phase 1]
2. [Phase 2]

## Files to Modify
- `file1.ts`: [why]
- `file2.ts`: [why]

## Risks
- [Risk + mitigation]
```

## Token Efficiency

### Abbreviations (internal use)
```
fn = function
impl = implementation
config = configuration
req/resp = request/response
auth = authentication
env = environment
var = variable
```

### Compact vs Verbose
```
Verbose: "The function takes a parameter called 'userId' which is a string"
Compact: "`userId: string` - user identifier"
```

### Reference, Don't Repeat
```
Bad:  [paste entire function]
Good: "See `processUser()` at auth.ts:45"
```
