# Planning Algorithms for AI Agents

## Overview

Planning algorithms help agents break down complex tasks into manageable steps and find optimal paths to goals.

### Layered Architecture
```
┌─────────────────────────────────┐
│  Strategic Planning (MCTS/HTN) │  Long-horizon, abstract
├─────────────────────────────────┤
│  Tactical Planning (MDP)       │  Medium-horizon, constrained
├─────────────────────────────────┤
│  Reactive Planning             │  Immediate response
└─────────────────────────────────┘
```

---

## 1. Monte Carlo Tree Search (MCTS)

### What It Is
MCTS finds optimal decisions by taking random samples in the decision space and building a search tree. Used famously in AlphaGo.

### Four Phases

```
1. SELECTION    - Navigate tree using UCB1 until leaf
2. EXPANSION    - Add new child node(s)
3. SIMULATION   - Random rollout to terminal state
4. BACKPROPAGATION - Update statistics up the tree
```

### Pseudocode
```python
function MCTS(rootState, iterations):
    root = Node(rootState)

    for i in range(iterations):
        node = root
        state = rootState.copy()

        # 1. Selection - UCB1
        while node.fullyExpanded() and not node.terminal:
            node = node.selectChild()  # UCB1
            state.applyAction(node.action)

        # 2. Expansion
        if not node.terminal:
            action = node.untriedActions.pop()
            state.applyAction(action)
            node = node.addChild(action, state)

        # 3. Simulation (rollout)
        while not state.terminal:
            state.applyAction(randomAction(state))
        reward = state.getReward()

        # 4. Backpropagation
        while node is not None:
            node.visits += 1
            node.totalReward += reward
            node = node.parent

    return root.bestChild().action
```

### UCB1 Formula
```
UCB1 = (totalReward / visits) + C * sqrt(ln(parentVisits) / visits)
         ↑ exploitation              ↑ exploration
```

---

## 2. Hierarchical Task Network (HTN)

### What It Is
HTN decomposes high-level tasks into primitive actions through a network of subtasks.

### Structure
```
Goal: Make Coffee
├── Get Cup
│   ├── Open cabinet
│   └── Take cup
├── Add Coffee
│   ├── Open jar
│   └── Scoop coffee
└── Add Water
    ├── Fill kettle
    └── Pour water
```

### Pseudocode
```python
function HTN_Plan(task, methods, state):
    if isPrimitive(task):
        if applicable(task, state):
            return [task]
        return FAILURE

    for method in methods[task]:
        if preconditions(method, state):
            subtasks = decompose(task, method)
            plan = []
            currentState = state

            for subtask in subtasks:
                subplan = HTN_Plan(subtask, methods, currentState)
                if subplan == FAILURE:
                    break
                plan.extend(subplan)
                currentState = applyPlan(subplan, currentState)

            if subplan != FAILURE:
                return plan

    return FAILURE
```

---

## 3. Hierarchical MCTS (H-MCTS)

### What It Is
Combines MCTS with task hierarchies to handle long-horizon problems. Reduces curse of dimensionality.

### Key Benefit
```
Standard MCTS: Must plan every primitive action
H-MCTS: Plans at abstract level, expands only when needed

Depth reduction: O(n) → O(log n) for n-step tasks
```

### When to Use
- Long planning horizons
- Large state spaces
- Reusable subtask patterns

---

## 4. A* Search (for deterministic planning)

### What It Is
Finds shortest path using heuristic estimation. Best for problems with clear goal states.

### Formula
```
f(n) = g(n) + h(n)
       ↑       ↑
    actual   heuristic
    cost     estimate
```

### Pseudocode
```python
function AStar(start, goal, heuristic):
    openSet = PriorityQueue()
    openSet.add(start, priority=heuristic(start))
    cameFrom = {}
    gScore = {start: 0}

    while not openSet.empty():
        current = openSet.pop()

        if current == goal:
            return reconstructPath(cameFrom, current)

        for neighbor in getNeighbors(current):
            tentativeG = gScore[current] + cost(current, neighbor)

            if tentativeG < gScore.get(neighbor, INF):
                cameFrom[neighbor] = current
                gScore[neighbor] = tentativeG
                fScore = tentativeG + heuristic(neighbor)
                openSet.add(neighbor, priority=fScore)

    return FAILURE
```

---

## Decision Tree: Which Algorithm?

```
Is the environment deterministic?
├── YES → Is there a clear goal state?
│   ├── YES → Use A* Search
│   └── NO → Use HTN Planning
└── NO (stochastic) → Is horizon long?
    ├── YES → Use H-MCTS
    └── NO → Use standard MCTS
```

---

## Comparison Table

| Algorithm | Best For | Complexity | Handles Uncertainty |
|-----------|----------|------------|---------------------|
| A* | Pathfinding, known maps | O(b^d) | No |
| HTN | Structured tasks | O(m^d) | No |
| MCTS | Games, uncertain outcomes | O(iterations) | Yes |
| H-MCTS | Long-horizon + uncertainty | O(iterations/depth) | Yes |

---

## LLM Agent Planning Pattern

For LLM agents, combine planning with execution:

```python
function planAndExecute(goal, tools):
    # Phase 1: Plan
    plan = LLM.generate(f"""
        Goal: {goal}
        Available tools: {tools}

        Create a step-by-step plan:
    """)

    steps = parseSteps(plan)
    results = []

    # Phase 2: Execute with re-planning
    for i, step in enumerate(steps):
        result = executeStep(step, tools)
        results.append(result)

        # Re-plan if needed
        if not satisfactory(result):
            remainingGoal = adjustGoal(goal, results)
            newPlan = LLM.generate(f"""
                Original goal: {goal}
                Completed: {results}
                Remaining: {remainingGoal}

                Revised plan:
            """)
            steps = parseSteps(newPlan)

    return synthesize(results)
```

---

## Sources
- [Planning Algorithms - A* to MCTS](https://ctoi.substack.com/p/planning-algorithms-from-a-to-monte)
- [Hierarchical MCTS Paper](https://www.mdpi.com/2073-8994/12/5/719)
- [HTN + MCTS Integration](https://www.sciencedirect.com/science/article/abs/pii/S0950705121003300)
- [MCTS Tutorial](https://gibberblot.github.io/rl-notes/single-agent/mcts.html)
