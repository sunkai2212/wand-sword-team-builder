export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function downloadCanvas(
  canvas: HTMLCanvasElement,
  date = new Date(),
): Promise<void> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("PNG 生成失败"));
    }, "image/png");
  });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `杖剑传说-阵容-${formatLocalDate(date)}.png`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
