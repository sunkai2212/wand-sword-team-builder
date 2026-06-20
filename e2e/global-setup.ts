import { createServer } from "vite";

export default async function globalSetup(): Promise<() => Promise<void>> {
  if (!process.env.CI) {
    try {
      const response = await fetch("http://127.0.0.1:5173", {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return async () => undefined;
    } catch {
      // No reusable development server is running.
    }
  }

  const server = await createServer({
    server: { host: "127.0.0.1", port: 5173, strictPort: true },
  });
  await server.listen();
  return async () => {
    await server.close();
  };
}
