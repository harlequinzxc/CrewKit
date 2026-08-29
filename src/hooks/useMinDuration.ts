export async function runWithMinDuration<T>(
  task: () => Promise<T>,
  minDurationMs: number
): Promise<T> {
  const startTime = Date.now();
  const result = await task();
  const elapsed = Date.now() - startTime;
  const remaining = minDurationMs - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  return result;
}
