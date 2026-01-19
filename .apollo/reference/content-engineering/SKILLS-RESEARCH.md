# AI Skills System Research

## How AI Tools Implement Skills/Personas

### 1. Skill Definition Patterns

#### Frontmatter-Based (Apollo Pattern)
```yaml
---
name: skill-name
description: Trigger conditions and use cases
---
# Skill Content
Workflow steps, templates, output formats
```

#### OpenAI Custom GPTs
- **System Instructions**: Core persona and behavior
- **Knowledge Files**: Uploaded context documents
- **Actions**: API integrations for external tools
- **Conversation Starters**: Suggested prompts

#### Claude Projects
- **Project Instructions**: Persistent context per project
- **Knowledge Base**: Uploaded files as context
- **No explicit "skills"**: Context injection via conversation

### 2. Trigger Mechanisms

| Pattern | Example | Best For |
|---------|---------|----------|
| Keyword | "debug", "fix bug" | Clear intent |
| Phrase | "why is this failing" | Natural language |
| Context | File type, error message | Automatic activation |
| Explicit | `/skill-name` | User control |

### 3. Context Injection Strategies

#### Layered Prompting (FLIP Pattern)
```
Layer 1: Base Identity (always active)
Layer 2: Domain Context (task-specific)
Layer 3: Skill Instructions (trigger-activated)
Layer 4: User Preferences (persistent)
```

#### Chain of Thought Enhancement
```markdown
## Before Acting
1. Identify the core problem
2. List what information you need
3. State your approach
4. Execute step by step
5. Verify results
```

### 4. Skill Structure Best Practices

```markdown
---
name: [skill-name]
description: [When to use, trigger words, context]
---

# [Skill Title]

## When to Use
- Trigger condition 1
- Trigger condition 2

## Workflow
### Step 1: [Action]
- Detail
- Detail

### Step 2: [Action]
...

## Output Format
[Template or example]

## Common Patterns
[Lookup table or decision tree]
```

### 5. Model-Specific Recommendations

| Model | Instruction Style | Best Practices |
|-------|------------------|----------------|
| GPT-4 | Detailed, step-by-step | Break complex tasks into phases |
| Claude | Concise, focused | Direct instructions, avoid overloading |
| Gemini | Focused prompts | Single-task clarity |

### 6. Advanced Techniques (2026)

1. **Context Engineering**: Inject external data dynamically
2. **Reverse Prompting**: Let AI suggest optimal prompts
3. **Agent Systems**: Self-orchestrating multi-step workflows
4. **Constitutional AI**: Built-in ethical constraints

## Implementation Recommendations for Apollo

### Skill File Structure
```
.apollo/skill/
  [skill-name]/
    SKILL.md           # Main skill definition
    examples/          # Example inputs/outputs
    templates/         # Reusable templates
```

### Skill Categories
1. **Task Skills**: debugging, refactoring, testing
2. **Output Skills**: documentation, slides, reports
3. **Domain Skills**: frontend, backend, devops
4. **Workflow Skills**: git, deployment, review

### Trigger Priority
1. Explicit command (`/skill`)
2. Keyword match in query
3. Context detection (file type, error pattern)
4. Default behavior

## Sources
- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Custom GPTs Guidelines](https://help.openai.com/en/articles/9358033-key-guidelines-for-writing-instructions-for-custom-gpts)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [IBM Prompt Engineering 2026](https://www.ibm.com/think/prompt-engineering)
