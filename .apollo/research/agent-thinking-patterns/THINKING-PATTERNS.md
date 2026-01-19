# Thinking Patterns for AI Agents

## Overview

Three main paradigms for structured AI reasoning:
- **Chain-of-Thought (CoT)**: Linear step-by-step reasoning
- **Tree-of-Thoughts (ToT)**: Branching exploration with backtracking
- **Graph-of-Thoughts (GoT)**: Arbitrary reasoning dependencies

---

## 1. Chain-of-Thought (CoT)

### What It Is
CoT guides the model through a step-by-step reasoning process using a coherent series of logical steps. Introduced by Google DeepMind in 2022.

### Variants

| Variant | Description | When to Use |
|---------|-------------|-------------|
| **Zero-Shot CoT** | Add "Let's think step by step" | Quick tasks, no examples needed |
| **Few-Shot CoT** | Provide example reasoning chains | Complex tasks, want specific format |
| **Auto-CoT** | Model generates own examples | Batch processing, diverse problems |

### Zero-Shot CoT Template
```
[Problem statement]

Let's think step by step:
```

### Few-Shot CoT Template
```
Example 1:
Problem: [example problem]
Reasoning:
- Step 1: [reasoning]
- Step 2: [reasoning]
Answer: [answer]

Now solve:
Problem: [actual problem]
Reasoning:
```

### Pseudocode
```
function chainOfThought(problem):
    prompt = problem + "\nLet's think step by step:"
    reasoning = LLM.generate(prompt)
    answer = extractAnswer(reasoning)
    return answer
```

### Limitations
- Only yields gains with models ~100B+ parameters
- Can introduce variability in answers
- Susceptible to error propagation in long chains

---

## 2. Tree-of-Thoughts (ToT)

### What It Is
ToT maintains a tree of thoughts where each node represents an intermediate reasoning step. Enables exploration of multiple paths with backtracking.

### Key Components (4 Questions)
1. How to decompose into thought steps?
2. How to generate potential thoughts from each state?
3. How to evaluate states heuristically?
4. What search algorithm to use?

### Search Algorithms
- **BFS**: Explore all branches at each depth before going deeper
- **DFS**: Explore one branch deeply, then backtrack

### ToT Pseudocode
```
function treeOfThoughts(problem, breadth=5, depth=3):
    root = createNode(problem)
    frontier = [root]

    for d in range(depth):
        candidates = []
        for node in frontier:
            # Generate multiple thought branches
            thoughts = LLM.generate(node.state, n=breadth)
            for thought in thoughts:
                child = createNode(node.state + thought)
                child.score = LLM.evaluate(child.state)
                candidates.append(child)

        # Select best candidates for next iteration
        frontier = selectBest(candidates, k=breadth)

    return getBestPath(frontier)
```

### Simplified ToT Prompt (Hulbert 2023)
```
Imagine three different experts answering this question.
All experts will write down 1 step of their thinking,
then share it with the group.
Then all experts will go on to the next step, etc.
If any expert realizes they're wrong at any point, they leave.

Question: [problem]
```

### Performance
- ToT beats CoT by 25% on Game of 24 task
- Up to 70% improvement in model reasoning

---

## 3. Graph-of-Thoughts (GoT)

### What It Is
GoT enables arbitrary reasoning dependencies between thoughts—not limited to tree structure.

### Comparison
```
CoT:  A → B → C → D (linear)
ToT:  A → B → D
         ↘ C → E (tree)
GoT:  A → B → D
       ↘ C ↗   (graph, C feeds into D)
```

### When to Use
| Pattern | Best For |
|---------|----------|
| CoT | Simple problems, well-defined steps |
| ToT | Problems needing exploration/backtracking |
| GoT | Complex problems with interdependent sub-problems |

---

## Decision Tree: Which Pattern to Use

```
Is the problem simple with clear steps?
├── YES → Use Chain-of-Thought
└── NO → Are there multiple valid approaches?
    ├── YES → Do sub-problems depend on each other?
    │   ├── YES → Use Graph-of-Thoughts
    │   └── NO → Use Tree-of-Thoughts
    └── NO → Use Chain-of-Thought with verification
```

---

## Sources
- [Prompt Engineering Guide - CoT](https://www.promptingguide.ai/techniques/cot)
- [Prompt Engineering Guide - ToT](https://www.promptingguide.ai/techniques/tot)
- [Princeton NLP - ToT Paper](https://github.com/princeton-nlp/tree-of-thought-llm)
- [IBM - Chain of Thought](https://www.ibm.com/think/topics/chain-of-thoughts)
