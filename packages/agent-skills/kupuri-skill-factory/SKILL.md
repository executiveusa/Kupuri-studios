---
name: kupuri-skill-factory
description: The master skill for generating and evolving agent capabilities within the Kupuri Ecosystem. Use this to create new "Kupuri Plugins" that allow GitHub Copilot to understand specific domains like JAAZ video generation, POSTIZ automation, or ecosystem-wide auth.
---

# Kupuri Skill Factory

## Design Philosophy
Skills are "Onboarding Guides" for the Kupuri OS. They transform a general AI into a specialized Kupuri architect.

## Anatomy of a Kupuri Skill
Follow this structure for every agent plugin:
```
packages/agent-skills/[skill-name]/
├── SKILL.md (The Brain: YAML Frontmatter + Instructions)
├── scripts/ (The Hands: Automation scripts)
├── references/ (The Memory: API docs, Schemas)
└── assets/ (The Body: Boilerplate, Icons, Templates)
```

## Refactoring Guidelines (Ralph Wiggins Style)
When migrating legacy tools (like the Anthropic Skills) to the Kupuri Factory:
1. **Identify the Intent**: What specific task is the skill simplifying?
2. **Kupurify the Brand**: Replace all references to "Claude" or "Anthropic" with "Kupuri Agent" or "GitHub Copilot".
3. **Connect to Monorepo**: Ensure script imports use `@kupuri/shared` or absolute workspace paths.
4. **Motion-First Integration**: If the skill involves UI, ensure it follows the `framer-motion` patterns in `@kupuri/ui`.

## Workflow
1. **Conceptualize**: Define the domain (e.g., `jaaz-video-engine`).
2. **Initialize**: Create the directory in `packages/agent-skills`.
3. **Instantiate**: Create `SKILL.md` with sharp, imperative instructions.
4. **Validate**: Run `npm run validate` to ensure the YAML is correct.
