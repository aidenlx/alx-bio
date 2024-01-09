export * from "./repo/js/slivar-functions.js";
import { aggregatedFreq } from "../pipeline/_freq.ts";

const allFreq = aggregatedFreq.map(function (v) {
  return v.toLowerCase();
});

export function freq_exceed(info, threshold) {
  return allFreq.some(function (key) {
    return key in info ? info[key] > threshold : false;
  });
}

export function cadd_exceed(info, threshold) {
  return "cadd_phred" in info ? info.cadd_phred >= threshold : false;
}
