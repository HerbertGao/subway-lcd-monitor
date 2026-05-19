English | [简体中文](./README.zh-CN.md)

# Subway LCD Monitor

> An MTR-style subway in-car LCD announcement display simulator, built with Vue 3 + TypeScript.

Subway LCD Monitor reproduces the look and behaviour of the LCD announcement screen mounted inside a metro carriage. It renders an MTR-style ultra-wide status bar that cycles through a full-route line map, a nearby-stations view and an arrival close-up, all driven by a controllable train running state and a per-line / per-city themeable visual system.

**Live demo:** <https://herbertgao.github.io/subway-lcd-monitor/>

## Features

- **MTR-style LCD panel** — an ultra-wide 7:2 status bar with the MTR look: light-grey screen background, a two-tone line strip, a yellow safety bar and a blue hint bar.
- **Three-scene rotation** — the panel cycles through three scenes: full-route line map, nearby-stations close-up, and arrival station close-up.
- **Dual state machines** — a `TrainFSM` drives the train through `STOPPED → DEPARTING → RUNNING → ARRIVING`, while a `SceneRotator` rotates scenes by duration within each train state, with manual override.
- **Transfer rendering** — at interchange stations the panel draws transfer-line branches off the main line.
- **Layered SVG rendering** — each scene is composed of dedicated SVG layers (background, line, station dots, markers, text, transfer branches).
- **Tiered theme system** — colours, fonts and scene configuration resolve through a three-level merge (line > city > default) and are injected as CSS variables for dynamic re-skinning.
- **Data-driven** — the metro network is described as JSON (bilingual station names, transfer info, door-opening side), with strict TypeScript types.
- **Control panel** — switch line, running direction and train state, or pin a specific scene manually.
- **Layered architecture** — data / core-logic / rendering layers are decoupled; the core logic is framework-agnostic pure TypeScript.

## Tech Stack

- **Vue 3** (Composition API, `<script setup>`) + **TypeScript** (strict mode)
- **Vite 7** — build tool and dev server
- **Pinia** — state management
- **Vitest** — unit testing for the core-logic layer
- **pnpm** — package manager
- Plain CSS + SVG rendering, no third-party UI component library

## Quick Start

Requirements:

- **Node.js** `^20.19.0 || ^22.13.0 || >=24`
- **pnpm** `11.1.2`

```bash
# install dependencies
pnpm install

# start the dev server (defaults to http://localhost:5173)
pnpm dev

# production build
pnpm build

# preview the build output
pnpm preview
```

Other useful scripts:

```bash
pnpm lint          # ESLint, zero warnings allowed
pnpm format:check  # Prettier format check
pnpm type-check    # vue-tsc type checking
pnpm test          # Vitest unit tests
```

## Deployment

Pushes to `master` are built and published to GitHub Pages automatically by `.github/workflows/deploy.yml`.

> **First-time setup:** before the first deploy, open the repository **Settings → Pages → Source** and select **GitHub Actions**. This cannot be done from code and must be done once manually, otherwise the first deployment will fail.

## Project Structure

```
src/
├── main.ts              # application entry
├── App.vue              # root component
├── core/                # framework-agnostic pure TypeScript core logic
│   ├── models/          # network / train / theme type definitions
│   ├── train-fsm.ts     # train state machine
│   ├── scene-rotator.ts # scene rotation controller
│   ├── data-loader.ts   # JSON data loading
│   ├── data-validator.ts# network data integrity validation
│   ├── theme-resolver.ts# tiered theme resolution
│   ├── train-state-visuals.ts # per-state visual derivation
│   ├── local-network.ts # local network helpers
│   └── logger.ts        # levelled logging facility
├── composables/         # Vue composables bridging core logic and reactivity
├── stores/              # Pinia stores (line / simulation)
├── components/
│   ├── lcd/             # LCD display components and scenes (scenes/)
│   ├── controls/        # control panel components
│   └── common/          # shared components (e.g. ErrorBoundary)
├── themes/              # theme definitions (default/ etc.)
└── data/                # metro network JSON data (e.g. beijing/)

openspec/                # OpenSpec capability specs and change proposals
```

## Architecture Overview

A three-layer architecture:

1. **Data layer** — `src/data/` — static JSON describing the metro network (Beijing Subway Yanfang & Fangshan lines), backed by TypeScript types.
2. **Core-logic layer** — `src/core/` — framework-agnostic pure TypeScript: state machines, data loading and validation, theme resolution, logging.
3. **Rendering layer** — `src/components/` + `src/composables/` — Vue components and CSS / SVG rendering.

Two cooperating state machines:

- **Train state machine (`TrainFSM`)** — drives the train through `STOPPED → DEPARTING → RUNNING → ARRIVING`, supporting automatic and manual modes.
- **Scene rotator (`SceneRotator`)** — each train state maps to a set of scenes that auto-rotate by duration, with manual override.

The MTR-style remaster was delivered in three phases — **visual** (MTR colour scheme, ultra-wide proportions, scene layouts), **states** (running-state-driven station dots, station close-ups, door-side hints) and **transfer content** (transfer-line branches at interchange stations).

Themes resolve through a **line > city > default** tiered merge and are injected via CSS variables for dynamic re-skinning. Scenes are rendered as layered SVG (background, line, dots, markers, text, transfer branches).

## Documentation

Specs and change history live under `openspec/`:

- `openspec/specs/` — current capability specifications (`dev-tooling`, `mtr-visual-style`, `mtr-train-states`, `experience-adaptation`, `runtime-robustness`).
- `openspec/changes/` — in-progress change proposals (`proposal.md`, `design.md`, `tasks.md`).
- `openspec/changes/archive/` — archived changes, including the MTR-style remaster phases.
