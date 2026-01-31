# Kupuri Agent Skills & Plugins
Inspired by the Ralph Wiggins (Anthropic) modular agent architecture.

## Overview
This package contains the "Brain" of the Kupuri Ecosystem agents. It allows for specialized domain knowledge to be loaded dynamically without bloating the context window.

## Core Plugins
- **[kupuri-thinking-loop](./kupuri-thinking-loop/SKILL.md)**: The recursive self-correction loop. Use this for complex architecture tasks.
- **[kupuri-skill-factory](./kupuri-skill-factory/SKILL.md)**: The meta-skill for building more plugins.
- **[kupuri-creative-engine](./kupuri-creative-engine/SKILL.md)**: Generative art and high-fidelity creative output.

## Workflow
1. Load a skill metadata via description.
2. Follow the `SKILL.md` instructions.
3. Use the `scripts/` to automate tasks.
4. Reference the `references/` for technical specs.

## Reiterating Loop
The `scripts/kupuri_loop.py` script allows the agent to self-diagnose and plan the next move in a recursive fashion.
