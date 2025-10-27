# Universal AI Video Upgrade Patch Implementation Plan

## Overview
This document summarizes the proposed "Universal AI Video Upgrade Patch" and breaks it down into an actionable roadmap tailored for the existing Kupuri Studios codebase. It focuses on incremental delivery, Google Cloud alignment, and the integration of advanced AI video editing capabilities while respecting engineering constraints.

## Objectives
- Establish a modular Turborepo-style architecture that supports Next.js frontends, shared packages, and specialized microservices.
- Integrate Google Cloud Platform services (Cloud Run, Pub/Sub, Cloud Storage, Cloud Workflows) for scalable video processing pipelines.
- Provide voice-first, AI-assisted editing experiences including automatic transcription, scene detection, and intelligent editing plans.
- Deliver professional export formats (EDL/XML) and monetization through a Stripe-backed token economy.
- Prepare for future enhancements such as real-time collaboration, predictive rendering, and accessibility automation.

## Current Repository Snapshot
- `react/`: Contains the existing web frontend implemented with React and Vite.
- `electron/` & `server/`: Support the desktop experience and backend API endpoints.
- `scripts/`, `assets/`, `node_modules/`: Auxiliary resources.

The current structure predates the Turborepo blueprint described in the upgrade prompt. Migrating must therefore begin with repository reorganization and dependency auditing.

## High-Level Migration Strategy
1. **Foundation & Tooling**
   - Introduce Turborepo with `pnpm` workspaces.
   - Carve the current React app into `apps/web` within the monorepo; migrate shared UI and utility logic into `packages/ui` and `packages/common`.
   - Establish TypeScript project references and shared linting/prettier configs.

2. **Backend Consolidation**
   - Modernize the existing server by adopting tRPC/Express hybrid endpoints.
   - Integrate Prisma with PostgreSQL (Dockerized locally) while planning a future Cloud SQL migration.
   - Migrate authentication to NextAuth for unified session handling across web and desktop surfaces.

3. **Google Cloud Alignment**
   - Provision Cloud Storage buckets (`raw`, `derived`, `renders`, `meta`).
   - Containerize critical workloads (ASR, Scene Detection, VL planning, Compilation) for Cloud Run deployment.
   - Define Pub/Sub topics and Cloud Workflow orchestration mirroring the ASR → SBD → VLMM → Compile → Export pipeline.

4. **Core AI Feature Integration**
   - **ASR & Diarization**: Implement WhisperX service with diarization and SRT export.
   - **Scene Detection**: Build the TransNetV2 + PySceneDetect service and surface scene metadata in the editor.
   - **Vision-Language Planning**: Integrate Gemini/Qwen-based planning service that consumes transcripts and scene data to emit structured cut plans.
   - **Compile & Export**: Translate VL plans into FFmpeg filtergraphs, Auto-Editor timelines, and EDL/XML deliverables.

5. **Voice-Driven Editing UX**
   - Extend the web editor with a voice command input backed by Gemini intent parsing.
   - Maintain edit timelines in a shared state store (e.g., Zustand) and reconcile AI-suggested edits with manual overrides.

6. **Monetization & Cost Controls**
   - Launch Stripe token packages with the mandated 33% margin.
   - Track per-job resource consumption (GPU seconds, storage, API calls) and decrement token balances accordingly.

7. **Futuristic Enhancements (Post-MVP)**
   - Real-time collaborative editing using WebSockets and operational transforms.
   - Emotion-aware pacing, predictive rendering, AI-driven storyboarding, and accessibility automation.
   - Advanced quality control (QC) and adaptive encoding for professional deliveries.

## Phase Breakdown
| Phase | Focus | Key Deliverables |
| --- | --- | --- |
| 1 | Turborepo foundation | `pnpm` workspaces, shared configs, migrated web app |
| 2 | Database & Auth | Prisma schema, PostgreSQL Docker setup, NextAuth integration |
| 3 | GCP Infrastructure | Terraform modules, Cloud Storage buckets, Pub/Sub topics |
| 4 | Core Services | WhisperX ASR, SBD service, VLMM planner, compile/export service |
| 5 | Frontend Enhancements | Voice-first editor, AI assistant panel, responsive marketing site |
| 6 | Monetization | Stripe tokens, usage metering, pricing UI |
| 7 | Advanced Features | Collaboration, emotion engine, predictive rendering, QC automation |

## Immediate Next Actions
1. Audit existing dependencies and confirm compatibility with `pnpm` and Turbo build pipelines.
2. Extract reusable UI primitives from `react/src` into a candidate `packages/ui` module.
3. Draft Terraform scaffolding for foundational GCP resources (buckets, service accounts, Pub/Sub topics).
4. Prototype the WhisperX Cloud Run service locally with Docker to validate GPU/CPU requirements.
5. Outline data contracts (`JobSpec`, `ASROut`, `VLPlan`, etc.) in a shared `packages/common` library to enforce type safety across services.

## Risks & Mitigations
- **Scope Creep**: The blueprint is extensive; enforce phased delivery with strict acceptance criteria for each phase.
- **Cost Overruns**: Implement budgeting hooks and telemetry from the start to ensure GPU usage stays within token allotments.
- **Model Volatility**: Pin model versions (WhisperX, Qwen, Gemini prompts) and add regression tests around plan generation outputs.
- **Team Adoption**: Provide internal documentation and workshops as the architecture shifts to Turborepo and Google Cloud services.

## References
- Upgrade prompt specifications (October 2025).
- Existing Kupuri Studios frontend/back-end repositories.
- Google Cloud product docs for Cloud Run, Workflows, Pub/Sub, Storage.

---
This document should evolve with implementation progress; treat it as the living source of truth for the upgrade initiative.
