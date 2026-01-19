#!/bin/bash

# Apollo CLI Setup Script
# Creates the ~/.apollo directory structure for skills, tools, and configuration

set -e

APOLLO_DIR="$HOME/.apollo"

echo "Setting up Apollo CLI..."

# Create main directory structure
mkdir -p "$APOLLO_DIR/skills"
mkdir -p "$APOLLO_DIR/tools"
mkdir -p "$APOLLO_DIR/plans"

# Create default AGENTS.md if it doesn't exist
if [ ! -f "$APOLLO_DIR/AGENTS.md" ]; then
  cat > "$APOLLO_DIR/AGENTS.md" << 'EOF'
# Apollo Agent Instructions

Add your custom instructions here. These will be included in every Apollo session.

## Example Instructions

- Prefer TypeScript over JavaScript
- Use functional programming patterns when possible
- Always add proper error handling
EOF
  echo "Created: $APOLLO_DIR/AGENTS.md"
fi

# Create example skill
EXAMPLE_SKILL_DIR="$APOLLO_DIR/skills/example-skill"
if [ ! -d "$EXAMPLE_SKILL_DIR" ]; then
  mkdir -p "$EXAMPLE_SKILL_DIR"
  cat > "$EXAMPLE_SKILL_DIR/SKILL.md" << 'EOF'
---
name: example-skill
description: An example skill to demonstrate the Apollo skills system. Use when user asks about creating skills or wants an example.
---

# Example Skill

This is an example skill for Apollo CLI.

## How Skills Work

Skills are loaded from:
- `~/.apollo/skills/` (global skills)
- `.apollo/skills/` (project-level skills)

Each skill needs:
1. A directory with the skill name
2. A `SKILL.md` file with YAML frontmatter

## Frontmatter Fields

- `name`: The skill identifier (required)
- `description`: When to use this skill - starts with "Use when..." (required)

## Creating Your Own Skills

1. Create a directory: `~/.apollo/skills/my-skill/`
2. Add `SKILL.md` with frontmatter and instructions
3. Apollo will automatically load it

EOF
  echo "Created: example skill"
fi

echo ""
echo "Apollo CLI setup complete!"
echo ""
echo "Directory structure:"
echo "  $APOLLO_DIR/"
echo "  ├── AGENTS.md       # Global instructions"
echo "  ├── skills/         # Custom skills"
echo "  ├── tools/          # Custom tools"
echo "  └── plans/          # Planning files"
echo ""
echo "To get started:"
echo "  1. Edit $APOLLO_DIR/AGENTS.md to add your preferences"
echo "  2. Create skills in $APOLLO_DIR/skills/"
echo "  3. Run 'apollo' to start"
