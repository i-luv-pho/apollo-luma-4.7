---
name: thinking
description: Activate structured thinking patterns for complex problems. Use when facing difficult tasks, multi-step problems, or when user asks to "think through", "analyze", "reason about", or "figure out" something. Triggers on "think", "analyze", "reason", "figure out", "step by step", "work through".
---

# Thinking Patterns Skill

## When to Use Which Pattern

```
Is the problem simple with clear steps?
├── YES → Chain-of-Thought (CoT)
└── NO → Are there multiple valid approaches?
    ├── YES → Do sub-problems depend on each other?
    │   ├── YES → Graph-of-Thoughts
    │   └── NO → Tree-of-Thoughts
    └── NO → CoT with verification
```

## Pattern Quick Reference

| Pattern | Best For | Trigger Phrase |
|---------|----------|----------------|
| CoT | Math, logic, sequential | "Let's think step by step" |
| ToT | Creative, exploration | "Consider multiple approaches" |
| ReAct | Tool use, research | Thought → Action → Observation |
| Reflexion | Error-prone tasks | "Review and improve" |

---

## 1. Chain-of-Thought (CoT)

### Zero-Shot (Quick)
```
[Problem]

Let's think step by step:
1. First, I identify...
2. Then, I consider...
3. Next, I apply...
4. Finally, I conclude...

Answer: [result]
```

### Structured CoT
```
[Problem]

## Understanding
- What do we know?
- What do we need to find?

## Approach
- Method I'll use and why

## Execution
- Step 1: [action] → [result]
- Step 2: [action] → [result]

## Verification
- Does this make sense?
- Edge cases checked?

## Conclusion
[Final answer with confidence level]
```

---

## 2. Tree-of-Thoughts (ToT)

### Multi-Expert Variant
```
[Problem]

Let me explore multiple approaches:

**Approach A**: [description]
- Pros: ...
- Cons: ...
- Likelihood: X%

**Approach B**: [description]
- Pros: ...
- Cons: ...
- Likelihood: X%

**Approach C**: [description]
- Pros: ...
- Cons: ...
- Likelihood: X%

**Selected**: Approach [X] because [reasoning]

Proceeding with selected approach...
```

### Three Experts Variant
```
Imagine three experts solving this:

Expert 1 thinks: [approach]
Expert 2 thinks: [different approach]
Expert 3 thinks: [another approach]

They discuss and find Expert [X]'s approach is best because...
```

---

## 3. ReAct (Reasoning + Acting)

### For Tool Use
```
Question: [user question]

Thought: I need to [reasoning about what to do]
Action: [tool_name]: [input]
Observation: [result from tool]

Thought: Based on that, I should [next reasoning]
Action: [next_tool]: [input]
Observation: [result]

Thought: I now have enough information to answer.
Final Answer: [comprehensive answer]
```

### Decision Loop
```
While not solved:
  1. Thought: What do I know? What do I need?
  2. Action: What tool/step helps most?
  3. Observation: What did I learn?
  4. Evaluate: Am I done? If not, loop.
```

---

## 4. Self-Reflection

### Before Acting
```
Before I proceed, let me verify:
- [ ] Do I understand the requirement?
- [ ] Is my approach reasonable?
- [ ] What could go wrong?
- [ ] Is there a simpler way?
```

### After Acting
```
Let me review my work:

**What I did**: [summary]
**What worked**: [positives]
**What could be better**: [improvements]
**Confidence**: [High/Medium/Low] because [reason]

Should I revise? [Yes/No + reasoning]
```

### Error Recovery
```
Wait, I notice a problem:
- Issue: [what went wrong]
- Root cause: [why it happened]
- Fix: [how to correct it]

Let me redo this step...
```

---

## 5. Planning for Complex Tasks

### Hierarchical Planning
```
## Goal: [end state]

### Phase 1: [milestone]
- Task 1.1: [specific action]
- Task 1.2: [specific action]

### Phase 2: [milestone]
- Task 2.1: [specific action]
- Task 2.2: [specific action]

### Dependencies
- Task 2.1 requires Task 1.2
- ...

### Risks
- [potential issue] → [mitigation]
```

---

## Implementation in Prompts

### Minimal Injection
Add to any task:
> "Think through this step by step before answering."

### Moderate Injection
> "Before answering:
> 1. Identify what's being asked
> 2. Consider 2-3 approaches
> 3. Choose the best approach with reasoning
> 4. Execute carefully
> 5. Verify the result"

### Full Injection
> "Use the following thinking process:
> - UNDERSTAND: Restate the problem
> - EXPLORE: List possible approaches
> - DECIDE: Pick best approach with reasoning
> - EXECUTE: Work through step by step
> - VERIFY: Check for errors
> - REFLECT: Could this be improved?"

---

## When to Activate

Activate thinking patterns when:
- Problem has multiple steps
- Answer isn't immediately obvious
- High stakes / errors are costly
- User explicitly asks to "think" or "analyze"
- Task involves planning or strategy
