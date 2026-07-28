# Member Player ID Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution in this session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each team member have a user-entered player ID that replaces repeated profession text in the board, editor, and exported PNG.

**Architecture:** Add `playerId` to the existing `Member` model and a small setter in `src/domain/team.ts`. UI components will render a fallback label when `playerId` is empty, while preserving the profession icon as the profession indicator. Export rendering will use the same label rule so generated images match the editor.

**Tech Stack:** TypeScript, Vite, Vitest, Playwright, Canvas export.

---

### Task 1: Domain support

**Files:**
- Modify: `src/domain/team.ts`
- Test: `tests/domain/team.test.ts`

- [x] Add a failing test that a member starts with empty `playerId`.
- [x] Add a failing test that setting `playerId` preserves skills, pet, profession, and cell.
- [x] Implement `setPlayerId(team, id, playerId)`.

### Task 2: UI support

**Files:**
- Modify: `src/ui/app.ts`
- Modify: `src/ui/board.ts`
- Modify: `src/ui/member-editor.ts`
- Test: `e2e/team-builder.spec.ts`

- [x] Add a failing browser test that typing a player ID updates the board label and editor heading.
- [x] Add a failing browser test that changing profession keeps the player ID.
- [x] Add the `队员ID` input to member editor and render fallback labels for empty IDs.

### Task 3: Export support

**Files:**
- Modify: `src/export/render-image.ts`
- Test: `e2e/team-builder.spec.ts`

- [x] Add a browser assertion that generated team data carries the configured player ID.
- [x] Use player ID labels in board and member rows inside the generated PNG.

### Task 4: Verify and snapshot

**Files:**
- Add: `docs/superpowers/checkpoints/2026-07-28-member-player-id.md`

- [x] Run `npm test`.
- [x] Run `npm run build:pages`.
- [x] Run `$env:CI='1'; npm run test:e2e`.
- [x] Save snapshot, commit, push, and verify GitHub Pages.
