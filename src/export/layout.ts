import type { Member } from "../domain/team";

export const EXPORT_WIDTH = 1080;

export const EXPORT_LAYOUT = {
  memberRowsY: 970,
  memberRowHeight: 190,
  memberRowGap: 16,
  bottomPadding: 50,
} as const;

export function calculateExportHeight(memberCount: number): number {
  const count = Math.min(4, Math.max(1, Math.trunc(memberCount)));
  return EXPORT_LAYOUT.memberRowsY
    + count * EXPORT_LAYOUT.memberRowHeight
    + (count - 1) * EXPORT_LAYOUT.memberRowGap
    + EXPORT_LAYOUT.bottomPadding;
}

export function orderedMembers(members: readonly Member[]): Member[] {
  return [...members].sort((left, right) => left.cell - right.cell);
}
