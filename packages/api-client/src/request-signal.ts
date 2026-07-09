export interface RequestSignalHandle {
  signal?: AbortSignal;
  cleanup: () => void;
}

export function createRequestSignal(input: { signal?: AbortSignal; timeoutMs?: number }): RequestSignalHandle {
  const timeoutMs =
    typeof input.timeoutMs === "number" && Number.isFinite(input.timeoutMs) ? Math.max(0, input.timeoutMs) : undefined;
  if (timeoutMs === undefined) {
    return {
      ...(input.signal ? { signal: input.signal } : {}),
      cleanup: () => {}
    };
  }

  const controller = new AbortController();
  const abortFromInput = () => {
    controller.abort(input.signal?.reason);
  };
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  if (input.signal?.aborted) {
    controller.abort(input.signal.reason);
  } else {
    input.signal?.addEventListener("abort", abortFromInput, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      input.signal?.removeEventListener("abort", abortFromInput);
    }
  };
}
