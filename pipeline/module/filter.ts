import { freqSource } from "@/pipeline/_freq.ts";
import data from "./filter.json" assert { type: "json" };

export const softFilterKey = "PASS";

const byQual = `(FILTER = '${softFilterKey}')`;

const byEffect = `(${data.targetEffects
  .map((effect) => `(ANN[*].EFFECT has '${effect}')`)
  .join(" | ")})`;

function getFreqQuery(threshold: number) {
  const exceeds = freqSource.global
    .concat(freqSource.eas)
    .map((key) => `((exists ${key}) & (${key} > ${threshold}))`);
  return `!(${exceeds.join(" | ")})`;
}

// export function getFilterQuery(query: "all", freq: number): string;
// export function getFilterQuery(query: "qual" | "effect"): string;
// export function getFilterQuery(query: "freq", freq: number): string;
export function getFilterQuery(query: OutputQuery, freq?: number): string {
  const byFreq = freq === undefined ? null : getFreqQuery(freq);
  if (query === "all") {
    if (!byFreq) throw new Error("freq is required if output full query");
    return `(${[byEffect, byFreq, byQual].join("&")})`;
  }
  switch (query) {
    case "qual":
      return byQual;
    case "effect":
      return byEffect;
    case "freq":
      if (!byFreq) throw new Error("freq is required if output freq query");
      return byFreq;
    default:
      throw new Error("unknown output mode");
  }
}

export const outputQuery = ["qual", "effect", "freq", "all"] as const;

export type OutputQuery = (typeof outputQuery)[number];
