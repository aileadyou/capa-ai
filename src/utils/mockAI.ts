import { novaScripts } from "@/mock-data";

type NovaScriptRegistry = typeof novaScripts;

const DEFAULT_MIN_DELAY_MS = 1500;
const DEFAULT_MAX_DELAY_MS = 3000;

function deterministicDelay(responseKey: string, minMs: number, maxMs: number) {
  const spread = Math.max(maxMs - minMs, 0);
  const keyWeight = Array.from(responseKey).reduce((total, char) => total + char.charCodeAt(0), 0);
  return minMs + (spread === 0 ? 0 : keyWeight % spread);
}

function getByPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

export async function mockAICall<T>(
  responseKey: string,
  options: {
    delayMs?: number;
    minDelayMs?: number;
    maxDelayMs?: number;
    fallback?: T;
  } = {},
): Promise<T> {
  const delayMs =
    options.delayMs ??
    deterministicDelay(
      responseKey,
      options.minDelayMs ?? DEFAULT_MIN_DELAY_MS,
      options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS,
    );

  await new Promise((resolve) => window.setTimeout(resolve, delayMs));

  const response = getByPath(novaScripts satisfies NovaScriptRegistry, responseKey);

  if (response === undefined) {
    if (options.fallback !== undefined) {
      return options.fallback;
    }

    return getByPath(novaScripts, "chatResponses.fallback") as T;
  }

  return response as T;
}

