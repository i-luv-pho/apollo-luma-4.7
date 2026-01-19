---
name: debugging
description: Use when debugging errors, investigating bugs, or troubleshooting issues. Triggers on "debug", "fix bug", "why is this failing", "error", "not working", "investigate".
---

# Debugging Workflow

## Step 1: Gather Evidence
- What is the exact error message?
- When does it occur? (always, sometimes, specific conditions)
- What changed recently?

## Step 2: Form Hypothesis
State clearly: "I think the bug is [X] because [Y]"

## Step 3: Test Hypothesis
- Read the relevant code (file:line)
- Check logs, outputs, state
- Run minimal reproduction if needed

## Step 4: Conclude
- Confirmed: "The bug is X. Here's the fix..."
- Disproved: "X is not the issue because... New hypothesis: Y"

## Step 5: Fix & Verify
- Make minimal change to fix the issue
- Verify fix works
- Check for side effects

## Common Debug Patterns
- "undefined is not a function" → Check import/export
- "null reference" → Trace data flow backwards
- "works locally, fails in prod" → Check env vars, paths
- "intermittent failure" → Race condition, timing, cache

## Output Format
🔍 INVESTIGATING: [brief description]
📍 LOCATION: file:line
💡 HYPOTHESIS: I think... because...
✅ CONFIRMED / ❌ DISPROVED
🔧 FIX: [solution]
