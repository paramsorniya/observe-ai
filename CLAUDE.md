# 🤖 Claude Code Instructions

## Mandatory startup steps (always do first)

1. Read `project_spec.md` completely.
2. Treat it as the SINGLE SOURCE OF TRUTH for the project.
3. Scan the entire codebase to understand current implementation.
4. Compare codebase vs project_spec.md to detect what is completed and what is pending.
5. Continue development from the next logical step.

## Development Rules

- Do NOT redesign architecture unless explicitly asked.
- Follow the folder structure and tech stack defined in project_spec.md.
- Reuse existing patterns and components.
- Keep code production-ready and clean.
- When unsure, inspect git history to understand recent changes.

## How to continue work

When the user says "continue", you should:
1. Re-read project_spec.md
2. Scan codebase
3. Summarize current progress
4. Suggest next tasks
5. Start implementing immediately




 Pending migration:
  - Run `npx prisma migrate dev --name add-payment-failed-at` to add paymentFailedAt column