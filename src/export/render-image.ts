import { pets, skills } from "../data/catalog";
import type { Member, Team } from "../domain/team";
import type { Pet, Profession, Skill } from "../domain/types";
import {
  calculateExportHeight,
  EXPORT_LAYOUT,
  EXPORT_WIDTH,
  orderedMembers,
} from "./layout";

export { calculateExportHeight, EXPORT_WIDTH, orderedMembers } from "./layout";

const COLORS = {
  ink: "#2f2b26",
  muted: "#756d63",
  paper: "#f4f1eb",
  panel: "#fffdfa",
  line: "#c8bcac",
  header: "#2f2b26",
  white: "#fffdfa",
} as const;

const BOARD = {
  x: 72,
  y: 185,
  width: 936,
  columns: 5,
  rows: 4,
  gap: 12,
} as const;

const PROFESSION_NAMES: Record<Profession, string> = {
  knight: "骑士",
  fighter: "斗士",
  warlock: "术士",
  sage: "贤者",
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
): void {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载图片：${src}`));
    image.src = src;
  });
}

async function safeLoadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  try {
    return await loadImage(src);
  } catch {
    return null;
  }
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  ctx.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label = "?",
): void {
  ctx.save();
  ctx.setLineDash([9, 7]);
  fillRoundedRect(ctx, x, y, width, height, 10, COLORS.paper, COLORS.line);
  ctx.setLineDash([]);
  if (label) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + width / 2, y + height / 2);
  }
  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, team: Team): void {
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 0, EXPORT_WIDTH, 150);
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "700 48px system-ui, sans-serif";
  ctx.fillText("杖剑传说·4v4阵容图", 64, 61);
  ctx.font = "500 27px system-ui, sans-serif";
  ctx.fillText(`当前：${team.stage}转`, 66, 113);
}

async function drawBoard(ctx: CanvasRenderingContext2D, team: Team): Promise<void> {
  const cellSize = (BOARD.width - BOARD.gap * (BOARD.columns - 1)) / BOARD.columns;
  const membersByCell = new Map(team.members.map((member) => [member.cell, member]));

  for (let cell = 0; cell < BOARD.columns * BOARD.rows; cell += 1) {
    const column = cell % BOARD.columns;
    const row = Math.floor(cell / BOARD.columns);
    const x = BOARD.x + column * (cellSize + BOARD.gap);
    const y = BOARD.y + row * (cellSize + BOARD.gap);
    const member = membersByCell.get(cell);
    fillRoundedRect(ctx, x, y, cellSize, cellSize, 16, COLORS.panel, COLORS.line);
    if (!member) continue;

    const image = await safeLoadImage(`/assets/professions/${member.profession}.svg`);
    if (image) {
      drawContainedImage(ctx, image, x + 24, y + 18, cellSize - 48, cellSize - 62);
    } else {
      drawPlaceholder(ctx, x + 34, y + 24, cellSize - 68, cellSize - 72);
    }
    ctx.fillStyle = COLORS.ink;
    ctx.font = "700 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(PROFESSION_NAMES[member.profession], x + cellSize / 2, y + cellSize - 16);
  }
}

async function drawIcon(
  ctx: CanvasRenderingContext2D,
  src: string | undefined,
  x: number,
  y: number,
  size: number,
): Promise<void> {
  if (!src) {
    drawPlaceholder(ctx, x, y, size, size, "");
    return;
  }
  const image = await safeLoadImage(src);
  if (!image) {
    drawPlaceholder(ctx, x, y, size, size);
    return;
  }
  fillRoundedRect(ctx, x, y, size, size, 12, COLORS.paper, COLORS.line);
  drawContainedImage(ctx, image, x + 3, y + 3, size - 6, size - 6);
}

async function drawMemberRow(
  ctx: CanvasRenderingContext2D,
  member: Member,
  index: number,
  skillCatalog: readonly Skill[],
  petCatalog: readonly Pet[],
): Promise<void> {
  const y = EXPORT_LAYOUT.memberRowsY
    + index * (EXPORT_LAYOUT.memberRowHeight + EXPORT_LAYOUT.memberRowGap);
  fillRoundedRect(ctx, 54, y, 972, EXPORT_LAYOUT.memberRowHeight, 18, COLORS.panel, COLORS.line);

  await drawIcon(ctx, `/assets/professions/${member.profession}.svg`, 72, y + 45, 88);
  ctx.fillStyle = COLORS.ink;
  ctx.font = "700 25px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(PROFESSION_NAMES[member.profession], 116, y + 158);

  const pet = petCatalog.find((candidate) => candidate.id === member.petId);
  ctx.fillStyle = COLORS.muted;
  ctx.font = "600 21px system-ui, sans-serif";
  ctx.fillText("宠物", 237, y + 32);
  await drawIcon(ctx, pet?.icon, 188, y + 48, 98);
  ctx.fillStyle = pet ? COLORS.ink : COLORS.muted;
  ctx.font = "600 19px system-ui, sans-serif";
  ctx.fillText(pet?.name ?? "未选择宠物", 237, y + 174);

  const iconSize = 68;
  const iconGap = 10;
  const skillsX = 352;
  for (const [kindIndex, kind] of (["active", "passive"] as const).entries()) {
    const groupX = skillsX + kindIndex * 4 * (iconSize + iconGap);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "600 21px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(kind === "active" ? "战技" : "秘法", groupX, y + 32);
    for (let slot = 0; slot < 4; slot += 1) {
      const skillId = member[kind][slot];
      const skill = skillCatalog.find((candidate) => candidate.id === skillId);
      await drawIcon(ctx, skill?.icon, groupX + slot * (iconSize + iconGap), y + 60, iconSize);
      ctx.fillStyle = COLORS.muted;
      ctx.font = "500 17px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(slot + 1), groupX + slot * (iconSize + iconGap) + iconSize / 2, y + 154);
    }
  }
}

export async function renderTeamImage(team: Team): Promise<HTMLCanvasElement> {
  if (team.members.length < 1 || team.members.length > 4) {
    throw new Error("导出阵容需要 1 至 4 名角色");
  }
  if (document.fonts?.ready) await document.fonts.ready;

  const members = orderedMembers(team.members);
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = calculateExportHeight(members.length);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器无法生成图片");

  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawHeader(ctx, team);
  await drawBoard(ctx, team);
  for (let index = 0; index < members.length; index += 1) {
    await drawMemberRow(ctx, members[index], index, skills, pets);
  }
  return canvas;
}
