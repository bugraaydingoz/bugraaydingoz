import type { createTelemetryRepository } from "./repository";

export function startRetention(repository: ReturnType<typeof createTelemetryRepository>) {
  let pending: Promise<void> | undefined;
  const tick = () => {
    if (pending) return;

    pending = (async () => {
      for (let batch = 0; batch < 10; batch++) {
        if ((await repository.deleteExpired()) < 5000) break;
      }
    })()
      .catch(() => console.error("Telemetry retention failed; will retry"))
      .finally(() => {
        pending = undefined;
      });
  };

  tick();

  const timer = setInterval(tick, 60_000);

  timer.unref();

  return async () => {
    clearInterval(timer);
    await pending;
  };
}
