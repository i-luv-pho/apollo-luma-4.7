# ReAct Patterns: Reasoning + Acting

## Overview

ReAct (Reasoning and Acting) combines chain-of-thought reasoning with external tool use in an interleaved manner. Introduced by Yao et al. (2022).

**Key Insight**: Reasoning traces help induce, track, and update action plans, while actions allow interfacing with external sources to gather information.

---

## The Core Loop

```
Thought → Action → Observation → Thought → Action → ...
```

### Template
```
Question: [user question]

Thought 1: I need to [reasoning about what to do]
Action 1: [tool_name][query or parameters]
Observation 1: [result from tool]

Thought 2: Based on [observation], I should [next reasoning]
Action 2: [tool_name][query or parameters]
Observation 2: [result from tool]

Thought 3: I now have enough information to answer.
Final Answer: [answer]
```

---

## ReAct Pseudocode

```
function react(question, tools, maxSteps=10):
    context = f"Question: {question}\n"

    for step in range(maxSteps):
        # Generate thought
        thought = LLM.generate(context + f"Thought {step+1}:")
        context += f"Thought {step+1}: {thought}\n"

        # Check if ready to answer
        if "Final Answer:" in thought:
            return extractAnswer(thought)

        # Generate action
        action = LLM.generate(context + f"Action {step+1}:")
        context += f"Action {step+1}: {action}\n"

        # Execute action and get observation
        toolName, query = parseAction(action)
        observation = tools[toolName].execute(query)
        context += f"Observation {step+1}: {observation}\n"

    return "Could not determine answer"
```

---

## When to Think vs. Act

| Situation | Do This |
|-----------|---------|
| Need external information | **ACT** - Use search/API tools |
| Need to synthesize findings | **THINK** - Reason about observations |
| Uncertain about next step | **THINK** - Plan approach |
| Have all needed info | **THINK** - Formulate answer |
| Previous action failed | **THINK** - Reason about why, adjust |

### Decision Flow
```
Do I have enough information to answer?
├── YES → Think and formulate Final Answer
└── NO → What information do I need?
    ├── External data → Act (search, API call)
    ├── Calculation → Act (calculator, code)
    └── Reasoning → Think (analyze what I have)
```

---

## Example: Research Question

```
Question: What is the population of the capital of France?

Thought 1: I need to find the capital of France first, then its population.
Action 1: Search[capital of France]
Observation 1: Paris is the capital of France.

Thought 2: Now I need to find the population of Paris.
Action 2: Search[population of Paris 2024]
Observation 2: Paris has a population of approximately 2.1 million in the city proper.

Thought 3: I now have the information needed to answer the question.
Final Answer: The population of Paris, the capital of France, is approximately 2.1 million.
```

---

## ReAct vs. Pure CoT vs. Pure Acting

| Approach | Strength | Weakness |
|----------|----------|----------|
| **CoT Only** | Good for reasoning | Can hallucinate facts |
| **Act Only** | Grounded in reality | No strategic reasoning |
| **ReAct** | Best of both | More steps needed |

### Performance
- HotpotQA: ReAct reduces hallucination by grounding in Wikipedia
- ALFWorld: 34% improvement over imitation learning
- WebShop: 10% improvement over RL methods

---

## Common Action Types

```python
TOOLS = {
    "Search": "Look up information from knowledge base",
    "Lookup": "Find specific term on current page",
    "Calculate": "Perform mathematical calculation",
    "Code": "Execute code snippet",
    "Finish": "Return final answer"
}
```

---

## ReAct Prompt Template

```markdown
Solve a question answering task with interleaving Thought, Action, Observation steps.

Thought: reason about the current situation
Action: the action to take, must be one of [{tool_names}]
Observation: the result of the action

Available tools:
- Search[query]: Search for information
- Calculate[expression]: Evaluate math expression
- Finish[answer]: Return the final answer

Question: {question}

Thought 1:
```

---

## Error Handling Pattern

```
Thought: The previous search didn't return useful results.
         Let me try a more specific query.
Action: Search[more specific query]
Observation: [new results]

Thought: This search also failed. Let me try a different approach...
```

---

## Sources
- [ReAct Paper - Yao et al. 2022](https://arxiv.org/abs/2210.03629)
- [Prompt Engineering Guide - ReAct](https://www.promptingguide.ai/techniques/react)
- [IBM - ReAct Agent](https://www.ibm.com/think/topics/react-agent)
- [ReAct Project Page](https://react-lm.github.io/)
