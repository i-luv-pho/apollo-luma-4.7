# Apollo GitHub Action

A GitHub Action that integrates [Apollo](https://github.com/i-luv-pho/apollov2) AI coding agent directly into your GitHub workflow.

Mention `/apollo` in your comment, and Apollo will execute tasks within your GitHub Actions runner.

## Features

### Explain an issue

Leave the following comment on a GitHub issue. Apollo will read the entire thread, including all comments, and reply with a clear explanation.

```
/apollo explain this issue
```

### Fix an issue

Leave the following comment on a GitHub issue. Apollo will create a new branch, implement the changes, and open a PR with the changes.

```
/apollo fix this
```

### Review PRs and make changes

Leave the following comment on a GitHub PR. Apollo will implement the requested change and commit it to the same PR.

```
Delete the attachment from S3 when the note is removed /apollo
```

### Review specific code lines

Leave a comment directly on code lines in the PR's "Files" tab. Apollo will automatically detect the file, line numbers, and diff context to provide precise responses.

```
[Comment on specific lines in Files tab]
/apollo add error handling here
```

When commenting on specific lines, Apollo receives:

- The exact file being reviewed
- The specific lines of code
- The surrounding diff context
- Line number information

This allows for more targeted requests without needing to specify file paths or line numbers manually.

## Quick Start

Run the following command in the terminal from your GitHub repo:

```bash
apollo github install
```

Or use the TUI command:

```
/install-github-app
```

This will walk you through installing the GitHub app, creating the workflow, and setting up secrets.

## Manual Setup

1. Install the GitHub app https://github.com/apps/apollo-agent. Make sure it is installed on the target repository.

2. Add the following workflow file to `.github/workflows/apollo.yml` in your repo:

   ```yml
   name: apollo

   on:
     issue_comment:
       types: [created]
     pull_request_review_comment:
       types: [created]

   jobs:
     apollo:
       if: |
         contains(github.event.comment.body, '/apollo') ||
         startsWith(github.event.comment.body, '/apollo')
       runs-on: ubuntu-latest
       permissions:
         id-token: write
         contents: read
         pull-requests: read
         issues: read
       steps:
         - name: Checkout repository
           uses: actions/checkout@v6
           with:
             persist-credentials: false

         - name: Run Apollo
           uses: i-luv-pho/apollov2/github@latest
           env:
             ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
           with:
             model: openai/gpt-4o
   ```

3. Store your API keys in repository secrets. In your organization or project **Settings**, expand **Secrets and variables** and select **Actions**. Add the required API keys.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `model` | Model to use (e.g., `openai/gpt-4o`) | Yes | - |
| `agent` | Agent to use (must be a primary agent) | No | `build` |
| `share` | Share the Apollo session | No | `true` for public repos |
| `prompt` | Custom prompt to override default | No | - |
| `mentions` | Comma-separated trigger phrases | No | `/apollo` |
| `auto_review` | Auto-review PRs on open/sync | No | `false` |
| `auto_fix` | Attempt automatic fixes | No | `false` |
| `allowed_tools` | Comma-separated allowed tools | No | - |
| `use_github_token` | Use GITHUB_TOKEN instead of Apollo App token | No | `false` |

## Provider Configuration

### Anthropic

```yml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
with:
  model: openai/gpt-4o
```

### OpenAI

```yml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
with:
  model: openai/gpt-4o
```

### Google

```yml
env:
  GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
with:
  model: google/gemini-2.0-flash
```

### Amazon Bedrock

For Bedrock, configure OIDC authentication instead of API keys:

```yml
permissions:
  id-token: write

steps:
  - name: Configure AWS credentials
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::ACCOUNT:role/GitHubActionsRole
      aws-region: us-east-1

  - name: Run Apollo
    uses: i-luv-pho/apollov2/github@latest
    with:
      model: amazon-bedrock/anthropic.claude-sonnet-4-20250514-v1:0
```

## Advanced Usage

### Auto-review on PR open

```yml
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  auto-review:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v6
      - uses: i-luv-pho/apollov2/github@latest
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        with:
          model: openai/gpt-4o
          auto_review: true
          prompt: "Review this PR for bugs, security issues, and code quality"
```

### Scheduled maintenance tasks

```yml
on:
  schedule:
    - cron: '0 0 * * 1'  # Every Monday at midnight

jobs:
  maintenance:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v6
      - uses: i-luv-pho/apollov2/github@latest
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        with:
          model: openai/gpt-4o
          prompt: "Update dependencies and fix any deprecation warnings"
```

## Troubleshooting

### "Could not fetch an OIDC token"

Make sure your workflow has the `id-token: write` permission:

```yml
permissions:
  id-token: write
```

### "User does not have write permissions"

Apollo requires the commenter to have write access to the repository. This prevents unauthorized users from triggering actions.

### Apollo doesn't respond to comments

Ensure the comment contains `/apollo` (the default trigger phrase) or your configured trigger phrases.

## Learn More

- [Apollo Documentation](https://github.com/i-luv-pho/apollov2/docs)
- [GitHub Integration Guide](https://github.com/i-luv-pho/apollov2/docs/github)
- [Apollo CLI](https://github.com/i-luv-pho/apollov2/docs/cli)
