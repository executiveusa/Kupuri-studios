# Uncodixify - Design Anti-Pattern Enforcement Skill

**Source**: [executiveusa/pauli-Uncodixfy](https://github.com/executiveusa/pauli-Uncodixfy)
**Category**: Design / UI Quality
**Scope**: All frontend work in Kupuri Studios

## What This Skill Does

Prevents generic AI-generated UI patterns ("Codex UI") from appearing in the codebase.
Enforces clean, human-designed interfaces inspired by Linear, Raycast, Stripe, and GitHub.

## When It Activates

This skill is **always active** for the Kupuri Studios design team. It applies to:
- All new React components
- Any UI modifications
- Dashboard and admin panel work
- Marketing pages and landing pages

## Quick Reference

### DO
- Simple sidebar: 240-260px, solid background, 1px border-right
- Buttons: solid fill, 8-10px radius max
- Cards: 8-12px radius, subtle borders, shadow ≤ 8px blur
- Typography: system fonts, 14-16px body, clear hierarchy
- Spacing: 4/8/12/16/24/32px scale only
- Transitions: 100-200ms ease, opacity/color changes only

### DON'T
- Glassmorphism (backdrop-filter, frosted panels)
- Pill shapes, radii > 16px
- Gradient backgrounds on UI elements
- Transform animations on hover
- Dramatic shadows (> 8px blur)
- Hero sections inside dashboards
- Metric-card grids as default layout
- Eyebrow labels / uppercase decorative text
- Decorative copy / ornamental descriptions

## Color Priority
1. Use existing project colors first (check CSS variables, tailwind.config.js)
2. Pick from predefined palettes in uncodixfy.md
3. Never invent random combinations

## Usage with Claude
This skill is auto-loaded. When working on UI in this project, Claude will:
1. Identify any Codex UI patterns it would normally use
2. Explicitly reject them
3. Apply Uncodixify standards instead

To explicitly invoke: `@uncodixfy` or mention "use uncodixify standards"
