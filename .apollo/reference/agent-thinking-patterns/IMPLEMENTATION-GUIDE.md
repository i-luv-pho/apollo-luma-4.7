# Implementation Guide: Injecting Thinking Patterns into Prompts

## Quick Reference

| Pattern | Best For | Prompt Trigger |
|---------|----------|----------------|
| CoT | Math, logic, multi-step | "Let's think step by step" |
| ToT | Creative, exploration | "Consider multiple approaches" |
| ReAct | Tool use, research | Thought/Action/Observation format |
| Reflexion | Error-prone tasks | "Review and improve" |

---

## 1. Chain-of-Thought Injection

### Minimal (Zero-Shot)
```
{task}

Let's think step by step.
```

### Structured
```
{task}

Work through this systematically:
1. First, identify what we know
2. Then, determine what we need to find
3. Next, apply relevant methods
4. Finally, verify the result
```

### With Format Control
```
{task}

Think through this step-by-step, showing your reasoning:
- Step 1: [your analysis]
- Step 2: [your analysis]
- ...
- Conclusion: [final answer]
```

---

## 2. Tree-of-Thought Injection

### Multi-Expert Variant
```
{task}

Approach this like a panel of 3 experts:

Expert A proposes: [approach 1]
Expert B proposes: [approach 2]
Expert C proposes: [approach 3]

Now evaluate each approach and select the best path forward.
```

### Exploration Mode
```
{task}

Before answering, explore multiple solution paths:

Path 1: [describe approach]
- Pros:
- Cons:
- Likelihood of success:

Path 2: [describe approach]
- Pros:
- Cons:
- Likelihood of success:

Selected path and reasoning:
```

---

## 3. ReAct Injection

### Standard Format
```
You have access to these tools:
{tool_descriptions}

Answer the question using this format:

Thought: reason about what to do
Action: tool_name[input]
Observation: (result will appear here)
... (repeat as needed)
Thought: I now have enough information
Final Answer: [your answer]

Question: {question}

Thought 1:
```

### Simplified (for prompts without tools)
```
{task}

Work through this using think-then-act cycles:

Think: What do I need to figure out first?
Check: [verify relevant facts]
Think: Based on that, what's next?
Check: [verify more facts]
Think: Now I can form my answer.
Answer: [final response]
```

---

## 4. Self-Reflection Injection

### Post-Response Check
```
{task}

[Generate response]

---
Now review your response:
- Is it factually accurate?
- Is the reasoning sound?
- Did you address all parts of the question?
- Any errors to correct?

If issues found, provide corrected response.
```

### Multi-Perspective Review
```
{task}

[Generate initial response]

---
Self-Assessment:

1. LOGIC CHECK: Are my reasoning steps valid?
2. COMPLETENESS: Did I miss anything important?
3. ASSUMPTIONS: What did I assume? Are assumptions valid?
4. ALTERNATIVES: Is there a better approach?

Revised response (if needed):
```

---

## 5. Combined Patterns

### ReAct + Reflection
```
{tools_and_question}

Use Thought/Action/Observation cycles to research.

After reaching a conclusion, reflect:
- Did I verify key facts?
- Could my sources be wrong?
- Is my reasoning sound?

Final Answer (incorporating reflection):
```

### CoT + ToT Hybrid
```
{task}

Step 1: Generate 2-3 possible approaches
Step 2: For the most promising approach, think through step-by-step
Step 3: Verify the solution
Step 4: Present final answer
```

---

## 6. Conditional Pattern Selection

### Auto-Select Based on Task Type
```python
def selectPattern(task):
    if needsExternalInfo(task):
        return REACT_TEMPLATE
    elif isComplexWithMultiplePaths(task):
        return TOT_TEMPLATE
    elif requiresReasoning(task):
        return COT_TEMPLATE
    else:
        return DIRECT_TEMPLATE
```

### Prompt-Level Auto-Selection
```
Analyze this task and choose the best approach:

Task: {task}

If this requires research → use Think/Act/Observe cycles
If this requires reasoning → think step-by-step
If this is straightforward → answer directly

Your approach and response:
```

---

## 7. System Prompt Integration

### For Code Agents
```
You are a coding assistant. When solving problems:

1. UNDERSTAND: Restate the problem in your own words
2. PLAN: Outline your approach before coding
3. IMPLEMENT: Write the code
4. VERIFY: Check for edge cases and errors
5. REFLECT: Would a different approach be better?

Always show your thinking before presenting code.
```

### For Research Agents
```
You are a research assistant with access to search tools.

Follow this pattern for each query:
- Thought: What do I need to find?
- Action: Search[query]
- Observation: [results]
- Thought: What does this tell me? What's still missing?
(repeat until confident)
- Final Answer: [synthesized response with citations]

Always verify claims from multiple sources when possible.
```

---

## 8. Pattern Intensity Levels

### Light (fast, low overhead)
```
{task}
Think briefly, then answer.
```

### Medium (balanced)
```
{task}
Let's work through this step by step.
```

### Heavy (thorough, higher quality)
```
{task}

Approach:
1. Consider multiple angles
2. Think through step-by-step
3. Check for errors
4. Provide verified answer

Your response:
```

---

## 9. Error Recovery Patterns

### When Response Seems Wrong
```
The previous response may have issues.

Original task: {task}
Previous response: {response}

Please:
1. Identify what might be wrong
2. Explain the correct approach
3. Provide an improved response
```

### Retry with Different Pattern
```
Let's try a different approach.

Task: {task}

Instead of [previous approach], let's:
[alternative pattern instructions]
```

---

## 10. Minimal Overhead Versions

When you need efficiency but some structure:

| Pattern | Minimal Version |
|---------|-----------------|
| CoT | Add "Think first:" before task |
| ToT | Add "Consider options:" before task |
| ReAct | Add "Research, then answer:" |
| Reflection | Add "Verify your answer." at end |

---

## Implementation Checklist

- [ ] Choose pattern based on task complexity
- [ ] Start with minimal injection, increase if needed
- [ ] Test with edge cases
- [ ] Monitor for over-reasoning (verbose but wrong)
- [ ] Add reflection for high-stakes outputs
- [ ] Set max iterations to prevent loops

---

## Sources
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Learn Prompting - CoT](https://learnprompting.org/docs/intermediate/chain_of_thought)
- [ReAct Paper](https://arxiv.org/abs/2210.03629)
- [Tree of Thoughts Paper](https://arxiv.org/pdf/2305.10601)
