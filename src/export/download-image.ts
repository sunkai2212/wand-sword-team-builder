export async function downloadCanvas(canvas: HTMLCanvasElement): Promise<void> {
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
    link.download = `杖剑传说-阵容-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
