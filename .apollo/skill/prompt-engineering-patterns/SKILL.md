---
name: prompt-engineering-patterns
description: Use when optimizing prompts, improving LLM outputs, designing production prompt templates, building AI applications, or troubleshooting LLM behavior. Covers Chain-of-Thought, few-shot learning, structured outputs, ReAct patterns, and production techniques. Triggers on "improve this prompt", "optimize LLM", "prompt template", or any prompt engineering task.
---

# Prompt Engineering Patterns

Master advanced prompt engineering techniques to maximize LLM performance, reliability, and controllability in production.

## Core Principles

1. **Be Specific**: Vague prompts produce vague outputs
2. **Provide Context**: Background information improves relevance
3. **Use Examples**: Show, don't just tell
4. **Structure Output**: Define format explicitly
5. **Iterate**: Test and refine systematically

---

## Fundamental Patterns

### 1. Zero-Shot Prompting

Direct instruction without examples. Works for simple, well-defined tasks.

**Best For**: Sentiment classification, basic extraction, simple Q&A

```
Classify the sentiment of this review as positive, negative, or neutral:
"The product arrived on time and works exactly as described."
```

### 2. Few-Shot Prompting

Provide 1-8 examples to establish patterns. Essential for complex or nuanced tasks.

**Best For**: Structured outputs (JSON, SQL, XML), domain-specific extraction, format consistency

```
Convert these product descriptions to JSON:

Input: "Nike Air Max, size 10, black, $129"
Output: {"brand": "Nike", "model": "Air Max", "size": "10", "color": "black", "price": 129}

Input: "Adidas Ultraboost, size 9, white, $180"
Output: {"brand": "Adidas", "model": "Ultraboost", "size": "9", "color": "white", "price": 180}

Input: "Puma RS-X, size 11, blue, $110"
Output:
```

### 3. Chain-of-Thought (CoT)

Encourage step-by-step reasoning. Critical for math, logic, and multi-step problems.

**Trigger phrase**: "Let's think step by step"

**Benefits**:
- Accuracy: Reduces errors in complex reasoning
- Coherence: More organized responses
- Debugging: Visible thought process reveals issues

**Variants**:

| Variant | Description | When to Use |
|---------|-------------|-------------|
| **Zero-Shot CoT** | Add "Let's think step by step" | Quick tasks, no examples needed |
| **Few-Shot CoT** | Provide example reasoning chains | Complex tasks, specific format |
| **Auto-CoT** | Model generates own examples | Batch processing, diverse problems |

**Template**:
```
Problem: [problem statement]

Let's think step by step:
1. First, I need to...
2. Then, I should...
3. Finally, I can...

Answer: [conclusion]
```

**Structured CoT with XML**:
```xml
<problem>Calculate the total cost with 8% tax for 3 items at $25 each</problem>

<thinking>
Step 1: Calculate subtotal: 3 × $25 = $75
Step 2: Calculate tax: $75 × 0.08 = $6
Step 3: Add tax to subtotal: $75 + $6 = $81
</thinking>

<answer>$81</answer>
```

### 4. ReAct (Reasoning + Acting)

Interleave reasoning with actions. Essential for agent-based systems with tool use.

**Pattern**:
```
Thought: I need to find the current weather in Tokyo
Action: search("Tokyo current weather")
Observation: Tokyo is currently 22°C with clear skies
Thought: Now I can answer the user's question
Answer: The current weather in Tokyo is 22°C with clear skies.
```

**Best For**: Multi-hop Q&A, fact verification, web navigation, tool orchestration

---

## Advanced Patterns

### 5. Tree-of-Thoughts (ToT)

Explore multiple reasoning paths with backtracking. Better than CoT for problems needing exploration.

**Performance**: ToT beats CoT by ~25% on complex reasoning tasks

**Simplified Prompt**:
```
Imagine three different experts answering this question.
All experts will write down 1 step of their thinking,
then share it with the group.
Then all experts will go on to the next step, etc.
If any expert realizes they're wrong at any point, they leave.

Question: [problem]
```

### 6. Self-Consistency

Generate multiple reasoning paths and select the most common answer.

```
Generate 5 different solutions to this problem, then select
the answer that appears most frequently.

Problem: [complex problem]
```

### 7. Chain of Verification (CoVe)

Four-phase process to reduce errors:

1. **Draft**: Initial analysis
2. **Plan**: Generate verification questions
3. **Verify**: Answer questions independently
4. **Revise**: Correct based on verification

### 8. Chain of Density (CoD)

Iteratively increase information density while maintaining fixed length.

```
Write a summary of this article in exactly 50 words.
Then rewrite it, adding 2 more key facts while keeping it at 50 words.
Repeat 3 times, maximizing information density.
```

---

## Structural Techniques

### XML Tags for Organization

```xml
<context>
You are a senior software engineer reviewing code.
</context>

<task>
Review the following code for security vulnerabilities.
</task>

<code>
[code here]
</code>

<output_format>
- Vulnerability type
- Location (line number)
- Severity (high/medium/low)
- Recommended fix
</output_format>
```

### Role Prompting

```
You are an expert [role] with [X] years of experience in [domain].
Your task is to [specific objective].

When responding:
- Consider [important factors]
- Avoid [common mistakes]
- Format your response as [format]
```

### Delimiter Patterns

Use clear delimiters to separate sections:

```
###CONTEXT###
[background information]

###TASK###
[what to do]

###CONSTRAINTS###
[limitations and requirements]

###OUTPUT###
[expected format]
```

---

## Production Techniques

### 1. Prompt Templates

```python
TEMPLATE = """
You are a {role} assistant.

Context: {context}

Task: {task}

Requirements:
{requirements}

Output format: {format}
"""
```

### 2. Guardrails

```
Before responding, verify:
1. Response is under {max_length} characters
2. No sensitive information is included
3. Format matches specified schema
4. Tone is appropriate for audience

If any check fails, regenerate the response.
```

### 3. Fallback Strategies

```
Primary task: [main objective]

If unable to complete:
1. Attempt simplified version
2. Request clarification on specific blocking issues
3. Provide partial result with clear indication of gaps
```

### 4. Output Validation

```json
{
  "response_schema": {
    "type": "object",
    "required": ["answer", "confidence", "sources"],
    "properties": {
      "answer": {"type": "string"},
      "confidence": {"type": "number", "minimum": 0, "maximum": 1},
      "sources": {"type": "array", "items": {"type": "string"}}
    }
  }
}
```

---

## Decision Framework

```
Is the problem simple with clear steps?
├── YES → Use Zero-Shot or basic Chain-of-Thought
└── NO → Are there multiple valid approaches?
    ├── YES → Do sub-problems depend on each other?
    │   ├── YES → Use Graph-of-Thoughts or ReAct
    │   └── NO → Use Tree-of-Thoughts
    └── NO → Use Chain-of-Thought with verification
```

## Quick Reference

| Goal | Pattern | Settings |
|------|---------|----------|
| **Accuracy** | Few-shot + CoT | Low temperature (0.1-0.3) |
| **Creativity** | Role persona | High temperature (0.7-0.9) |
| **Consistency** | Structured output + validation | Temperature 0 |
| **Complex reasoning** | ToT or ReAct + self-consistency | Medium temperature (0.5) |
| **Production** | Templates + guardrails + fallbacks | Temperature 0-0.3 |

## Anti-Patterns to Avoid

1. **Vague instructions**: "Make it better" → "Improve clarity by using shorter sentences"
2. **Missing context**: Always provide relevant background
3. **Overloading**: Break complex tasks into subtasks
4. **No examples**: For nuanced tasks, always show examples
5. **Ignoring format**: Specify exact output structure
6. **No verification**: Add self-checking steps for critical tasks

## Testing Checklist

- [ ] Test with edge cases
- [ ] Verify output format consistency
- [ ] Check behavior with missing/malformed input
- [ ] Measure latency and token usage
- [ ] Validate against ground truth examples
- [ ] Test at different temperature settings
