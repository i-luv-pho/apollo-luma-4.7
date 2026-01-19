# Self-Reflection Patterns for AI Agents

## Overview

Self-reflection enables agents to critique their own outputs, detect errors, and iteratively improve. Key finding: LLMs are 64.5% better at finding errors in external input than their own outputs.

---

## 1. Reflexion Framework

### What It Is
Reinforces language agents through linguistic feedback. Converts environment feedback into self-reflection for rapid learning from mistakes.

### Loop
```
Task → Attempt → Feedback → Reflection → Retry
```

### Pseudocode
```python
function reflexion(task, maxAttempts=3):
    memory = []

    for attempt in range(maxAttempts):
        # Generate attempt
        response = LLM.generate(f"""
            Task: {task}
            Previous attempts: {memory}

            New attempt:
        """)

        # Get feedback
        feedback = evaluate(response, task)

        if feedback.success:
            return response

        # Self-reflect
        reflection = LLM.generate(f"""
            Task: {task}
            My attempt: {response}
            Feedback: {feedback}

            What went wrong and how can I improve?
        """)

        memory.append({
            "attempt": response,
            "feedback": feedback,
            "reflection": reflection
        })

    return getBestAttempt(memory)
```

---

## 2. Multi-Perspective Reflection (PR-CoT)

### What It Is
After initial reasoning, assess across multiple predefined angles. From January 2026 research.

### Four Perspectives
1. **Logical Consistency** - Does reasoning follow logically?
2. **Information Completeness** - Any missing data?
3. **Biases/Ethics** - Any problematic assumptions?
4. **Alternative Solutions** - Better approaches?

### Template
```markdown
My initial answer: [answer]

Self-Assessment:

1. LOGICAL CONSISTENCY
   - Are my reasoning steps valid?
   - Any logical fallacies?

2. INFORMATION COMPLETENESS
   - What information did I use?
   - What might I be missing?

3. BIAS CHECK
   - Any assumptions I made?
   - Could this be wrong?

4. ALTERNATIVES
   - What other approaches exist?
   - Why is my approach better?

Revised answer (if needed): [improved answer]
```

---

## 3. Iterative Self-Correction

### Key Finding
Iterative reflection compensates for weak error detection. Claude: 10% direct detection → 61% with iteration.

### Pattern
```python
function iterativeCorrect(response, maxIterations=3):
    current = response

    for i in range(maxIterations):
        critique = LLM.generate(f"""
            Response: {current}

            Find any errors, inconsistencies, or improvements:
        """)

        if "no errors found" in critique.lower():
            break

        current = LLM.generate(f"""
            Original: {current}
            Issues found: {critique}

            Corrected response:
        """)

    return current
```

---

## 4. Dual-Loop Reflection (Metacognitive)

### Structure
```
┌──────────────────────────────────────┐
│  Loop 1: EXTROSPECTION               │
│  Compare reasoning to reference      │
├──────────────────────────────────────┤
│  Loop 2: INTROSPECTION               │
│  Build reflection bank from insights │
└──────────────────────────────────────┘
```

### When to Use Each
| Loop | Trigger | Action |
|------|---------|--------|
| Extrospection | After generating response | Compare to known good examples |
| Introspection | After finding error pattern | Save insight for future |

---

## 5. Error Detection Prompts

### Simple Self-Check
```
Review your response for:
- Factual accuracy
- Logical consistency
- Completeness
- Clarity

If you find issues, provide a corrected version.
```

### Structured Verification
```
VERIFY your response:

□ Claims are factually accurate
□ Reasoning steps are valid
□ All parts of question addressed
□ No contradictions present
□ Appropriate confidence level

Issues found: [list or "None"]
```

---

## 6. The Accuracy-Correction Paradox

### Finding
Weaker models achieve higher correction rates than stronger models:
- GPT-3.5 (66% accuracy): 26.8% correction rate
- DeepSeek (94% accuracy): 16.7% correction rate

### Explanation: Error Depth Hypothesis
Stronger models make fewer but "deeper" errors that resist self-correction.

### Implication
Don't assume stronger models need less reflection—their errors may be harder to catch.

---

## Self-Reflection Decision Tree

```
Did the task complete successfully?
├── YES → Quick sanity check
│   └── Any obvious issues? → Fix and done
└── NO → What type of failure?
    ├── Wrong answer → Multi-perspective review
    ├── Incomplete → Check information completeness
    ├── Unclear → Rewrite for clarity
    └── Unknown → Iterative self-correction
```

---

## Template: Full Self-Reflection Cycle

```markdown
## Task
[Original task]

## Initial Response
[First attempt]

## Self-Reflection

### What I did well
- [strength 1]
- [strength 2]

### What could be improved
- [issue 1]: [how to fix]
- [issue 2]: [how to fix]

### Verification checklist
- [ ] Factually accurate
- [ ] Logically consistent
- [ ] Complete answer
- [ ] Clear communication

## Revised Response
[Improved version incorporating reflection]
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Better Approach |
|--------------|---------|-----------------|
| Rubber-stamping | Always says "looks good" | Use specific criteria |
| Over-correction | Changes correct answers | Only fix verified issues |
| Endless loops | Never satisfies self | Set max iterations |
| Vague feedback | "Could be better" | Specific, actionable critique |

---

## Sources
- [Multi-Perspective Reflection Paper (2026)](https://arxiv.org/abs/2601.07780)
- [Reflexion - Prompt Engineering Guide](https://www.promptingguide.ai/techniques/reflexion)
- [Self-Reflection in LLM Agents](https://arxiv.org/pdf/2405.06682)
- [Decomposing LLM Self-Correction](https://web3.arxiv.org/pdf/2601.00828)
- [Self-Reflection for Academic Responses](https://www.nature.com/articles/s44387-025-00045-3)
