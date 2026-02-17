/// <reference lib="webworker" />

import { optimizePortfolios } from "./search";
import type { OptimizerInput } from "./types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<{ type: "optimize"; payload: OptimizerInput }>) => {
  if (event.data.type !== "optimize") return;

  const results = optimizePortfolios(event.data.payload, (progress) => {
    self.postMessage({ type: "progress", payload: progress });
  });
  self.postMessage({ type: "done", payload: results });
};

export {};
