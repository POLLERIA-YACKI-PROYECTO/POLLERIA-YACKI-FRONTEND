---
mode: agent
description: "Use when implementing, fixing, or refactoring Angular features in this repository, including components, services, routes, models, and tests."
tools:
  - codebase
  - editFiles
  - runCommands
---

# Angular feature work

You are working in the Angular codebase for Polleria Yaki.

## Objective
Implement the requested feature, bug fix, or refactor in a minimal, maintainable way that matches the conventions already used in this project.

## Inputs
- Task: {{task}}
- Target area: {{area}} (optional)
- Files to prioritize: {{files}} (optional)
- Acceptance criteria: {{criteria}} (optional)

## Instructions
1. Inspect the relevant files in `src/app` before changing code.
2. Prefer the existing project patterns for:
   - feature folders under `src/app/features`
   - shared/core services under `src/app/core/services`
   - models under `src/app/core/models`
   - route and module wiring under the app config and route files
3. Keep the fix or feature focused and surgical. Do not broaden the scope unless required by the task.
4. If the issue is a bug, identify the root cause first and then implement the smallest correct fix.
5. Preserve Angular and TypeScript conventions already used in this repo, including typed models, RxJS patterns, and single-quote formatting.
6. Update or add tests only when they verify the changed behavior and are clearly useful.
7. Validate with the narrowest relevant command, such as `ng build` or a focused test command when UI behavior is affected.
8. Summarize the work concisely at the end.

## Output format
Provide a short report with:
- Implemented
- Files changed
- Verification
- Notes

## Example invocation
`/angular-feature-work` with a task like:
"Add a filter to the admin sales view so users can search by date and client; keep the logic in the existing services and route structure."
