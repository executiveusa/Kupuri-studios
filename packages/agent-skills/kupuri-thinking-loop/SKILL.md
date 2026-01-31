---
name: kupuri-thinking-loop
description: Advanced recursive thinking and self-correction loop for GitHub Copilot. This skill should be used when tackling complex architectural migrations, multi-step environment fixes, or high-stakes logic refactors within the Kupuri Ecosystem. It forces a cycle of planning, simulation, execution, and validation to ensure zero-defect delivery.
---

# Kupuri Recursive Thinking Loop

## Overview
The Kupuri Thinking Loop is a specialized cognitive framework that enables the agent to operate as an autonomous architect. Instead of executing commands linearly, the agent enters a state recursive evaluation to solve "impossible" blockers.

## The Sequential Thinking Loop
When this skill is triggered, follow this iterative state machine:

### 1. Planning Step (Thought N)
- **Objective**: Define the immediate sub-task and its success criteria.
- **Verification**: Does this step lead to the global goal?
- **Tools**: `manage_todo_list`, `semantic_search`.

### 2. Risk Assessment
- **Objective**: Identify potential side effects (e.g., breaking `pnpm` workspaces, Windows `MAX_PATH` errors).
- **Branching**: If risk is high, branch to a "Safe Simulation" thought.

### 3. Execution (The Action)
- **Objective**: Deploy the code or fix.
- **Constraints**: Use absolute paths; follow `@kupuri` design tokens.

### 4. Validation & Reflection
- **Objective**: Verify the fix via `get_errors` or `run_in_terminal`.
- **Correction**: If validation fails, use the `isRevision` flag to backtrack to Step 1.

## Rules of Engagement
- **No Stop Policy**: Continue the loop until the environment is functional.
- **Self-Correction**: If a tool fails (e.g., `pnpm install`), immediately analyze the output and pivot to a workaround (e.g., `--shamefully-hoist`).
- **Context Preservation**: Update `SESSION-SUMMARY.md` after every major loop completion.

## Tooling Integration
- **Relay Mechanism**: For backend tasks, use `server/services/agent_registry.py` to orchestrate Python agents.
- **UI Logic**: For frontend tasks, refer to `packages/ui/SKILL.md` for motion primitives.

## When to Trigger
- Build environment failures (`turbo` or `pnpm` issues).
- Complex monorepo migrations (legacy `react/` to `apps/web/`).
- Codebase-wide refactors involving shared types.
