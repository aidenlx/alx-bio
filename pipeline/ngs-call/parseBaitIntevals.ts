import { existsSync } from "@/deps.ts";
import { SupportAssembly, Interval } from "../_res.ts";
import { assertNever } from "@/utils/assert-never.ts";

const presetBaits = new Set(Object.keys(Interval.Bait));
const isPresetBait = (key: string): key is keyof typeof Interval.Bait => {
  return presetBaits.has(key);
};

export function parseBaitIntevals(
  intervalsOpts: (string | true)[] | undefined,
  assembly: SupportAssembly
): string | null {
  if (!intervalsOpts) return null;
  const defaultBait = Interval.Bait.AgilentV6r2[assembly];
  const finalBait = intervalsOpts.reduce((prev, value) => {
    if (value === true) {
      // enable default bait, don't override
      if (prev === null) return defaultBait;
      else return prev;
    } else if (typeof value === "string") {
      // always override previous value
      if (isPresetBait(value)) {
        const baitList = Interval.Bait[value],
          bait = baitList[assembly as keyof typeof baitList];
        if (bait) return bait;
        else
          throw new Error(
            `Bait Intervals of ${value} don't support ${assembly}`
          );
      } else {
        return value;
      }
    } else {
      assertNever(value);
    }
  }, null as string | null);
  if (finalBait && !existsSync(finalBait)) {
    throw new Error(`Bait Intervals file ${finalBait} not found`);
  }
  return finalBait;
}

export const toIntervalScatter = (sample: string, assembly: SupportAssembly) =>
  `${sample}.${assembly}.interval_scatter`;
