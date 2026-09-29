# PRDF - Kupuri-studios (Production Readiness & Design Findings)
Inspected: 2026-09-28. Real code inspection, README ignored. Benchmark: Collins + gauntlet.

## VERDICT: TIER 3 (portfolio) - MODIFIED FORK OF JAaz, IDENTITY + WEIGHT PROBLEM
GitHub FORK of the jaaz open-source AI design tool (v1.0.30): electron desktop app (ComfyUI installer/manager, gemini_service, ipcHandlers), react/, server/, pyproject.toml, litellm config, 291MB with ~40 completion/handoff report docs, plus stray artifacts ("yappyverse-comics (1)" dir + zip). Stale since March.

## EVIDENCE
- Fork provenance confirmed (fork:true). LICENSE present (upstream).
- Electron + python hybrid; tests/ + vitest config exist (unrun - 291MB clone, electron build out of audit scope).
- ~40 self-congratulatory "COMPLETION-REPORT" docs vs no verified running product - documentation theater risk (gauntlet: evidence over narrative).

## VIOLATIONS / GAPS
1. HIGH - Identity: this is upstream jaaz with modifications, not a Kupuri product. Presenting it as her studio's work would break Collins honesty gates and the fork's license spirit. Fix: owner decision - keep as internal tool, contribute back, or replace with an owned product (kupuri-oma/studio exists).
2. MED - 291MB repo with binary artifacts (yappyverse zips) - needs the deletion-law manifest treatment before any cleanup (owner numbers required).
3. MED - Unverified build/tests; stale 6+ months.
4. LOW - Doc flood (~40 reports) obscures actual state.

## FIX LIST
0 (owner) disposition decision; 1 (owner) deletion manifest for binaries; 2 (2h) verify build or mark archived. Estimated: owner-led.

## PORTFOLIO ROLE
Do NOT include in her portfolio. Internal tool at most.
