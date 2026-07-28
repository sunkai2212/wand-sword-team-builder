# Team Builder Polish, Drag, and Full Skill Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution in this session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the builder UI, add pointer-based character dragging, and show all eligible profession skills in each skill picker.

**Architecture:** Keep the current vanilla TypeScript/Vite architecture. Add board drag handlers to `src/ui/board.ts` and route movement through existing `moveMember()` in `src/ui/app.ts`. Change `src/ui/pickers.ts` to render grouped eligible skills from the existing catalog without changing catalog data or export rendering.

**Tech Stack:** TypeScript, Vite, Vitest, Playwright, CSS.

---

### Task 1: Lock behavior with tests

**Files:**
- Modify: `e2e/team-builder.spec.ts`

- [ ] Add a Playwright test for four-turn knight skill picker: open a knight active slot at 四转, assert 1-4 turn active icons are visible and 5-7 are absent.
- [ ] Add a Playwright test for seven-turn warlock skill picker: open a warlock active slot at 七转, assert 1-7 turn active icons are visible.
- [ ] Add a Playwright test for dragging a character from one board cell to an empty board cell.
- [ ] Add a Playwright test proving dragging onto an occupied cell does not move either character.
- [ ] Run the targeted Playwright tests and confirm they fail before implementation.

### Task 2: Add board drag interaction

**Files:**
- Modify: `src/ui/board.ts`
- Modify: `src/ui/app.ts`

- [ ] Extend board handlers with `onCellDrop(from, to)`.
- [ ] Make occupied cells draggable through pointer events.
- [ ] Track dragged source cell and hovered target cell inside the board renderer.
- [ ] On pointer release over an empty board cell, call `onCellDrop(from, to)`.
- [ ] Keep existing click-to-select movement unchanged.

### Task 3: Show all eligible skills

**Files:**
- Modify: `src/ui/pickers.ts`

- [ ] Remove the tab-only picker flow.
- [ ] Filter skills by selected member profession, selected skill kind, and `skill.stage <= team.stage`.
- [ ] Group visible options by stage label inside one scrollable grid.
- [ ] Preserve duplicate-skill disabled behavior and clear/cancel focus behavior.

### Task 4: Frontend polish

**Files:**
- Modify: `src/styles.css`
- Optionally Modify: `src/ui/app.ts`, `src/ui/member-editor.ts`

- [ ] Improve the page shell, toolbar, board, editor cards, picker modal, and button states.
- [ ] Keep mobile width safe at 360-390px.
- [ ] Respect reduced-motion settings.

### Task 5: Verify and snapshot

**Files:**
- Add: `docs/superpowers/checkpoints/2026-07-28-team-builder-polish-drag-full-skill-picker.md`

- [ ] Run `npm test`.
- [ ] Run `npm run build:pages`.
- [ ] Run `CI=1 npm run test:e2e`.
- [ ] Save a checkpoint with changed files, verification evidence, and next-step notes.
