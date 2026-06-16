export const MAX_RETRIES = 4;
export const BASE_DELAY_MS = 2000;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function describeApiError(err: unknown): string {
  const e = err as { status?: number; message?: string; code?: string };
  const parts: string[] = [];
  if (typeof e?.status === "number") parts.push(`status=${e.status}`);
  if (e?.code) parts.push(`code=${e.code}`);
  const msg = String(e?.message ?? err);
  if (msg) parts.push(msg);
  return parts.join(" | ") || "unknown error";
}

export function isRetriableError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429) return true;
  if (typeof status === "number" && status >= 500 && status < 600) return true;
  const msg = String((err as { message?: string })?.message ?? err);
  return /RESOURCE_EXHAUSTED|UNAVAILABLE|INTERNAL|DEADLINE_EXCEEDED|429|5\d\d/.test(
    msg,
  );
}

export async function withVertexRetry<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < MAX_RETRIES && isRetriableError(error)) {
        const delay =
          BASE_DELAY_MS * Math.pow(2, attempt) +
          Math.floor(Math.random() * 750);
        console.warn(
          `Retrying ${label} after transient Vertex error (attempt ${
            attempt + 1
          }/${MAX_RETRIES}) in ${delay}ms — ${describeApiError(error)}`,
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Unreachable: ${label}`);
}
