# Project Memory - APOLLO.md
<!-- Place this file in your project root. Apollo reads it automatically. -->

## Project Overview
<!-- Describe what this project does in 1-2 sentences -->
This is a [web app / CLI tool / API service] that [main purpose].

## Tech Stack
<!-- List primary technologies so Apollo understands the codebase -->
- Language: TypeScript / Python / Go
- Framework: React / Next.js / FastAPI
- Database: PostgreSQL / MongoDB / SQLite
- Package Manager: npm / pnpm / bun

## Code Style
<!-- Define conventions Apollo should follow -->
- Use functional components over classes
- Prefer async/await over .then() chains
- Name files with kebab-case
- Export types from dedicated `types.ts` files

## Testing
<!-- How to run tests and what patterns to follow -->
```bash
bun test           # Run all tests
bun test:watch     # Watch mode
```
- Use describe/it blocks with clear names
- Mock external services, not internal modules
- Test files: `*.test.ts` next to source files

## Common Tasks
<!-- Commands Apollo might need to run -->
```bash
bun dev            # Start development server
bun build          # Production build
bun lint           # Check code style
bun db:migrate     # Run database migrations
```

## Architecture Notes
<!-- Key design decisions Apollo should understand -->
- Services handle business logic, controllers handle HTTP
- Use dependency injection for testability
- Errors bubble up; don't catch unless handling

## Modular Rules
<!-- Import additional rules from .apollo/rules/ -->
@.apollo/rules/security.md
@.apollo/rules/api-patterns.md
