import { existsSync } from "@/deps.ts";
import { SupportAssembly, Interval } from "../_res.ts";

export function parseBaitIntevals(
  intervalsOpt: true | string | undefined,
  assembly: SupportAssembly
): string | null {
  if (intervalsOpt === undefined) return null;
  if (intervalsOpt === true) return Interval.Bait.AgilentV6r2[assembly];
  if (Object.keys(Interval.Bait).includes(intervalsOpt)) {
    type BaitKey = keyof (typeof Interval)["Bait"];
    const baits = Interval.Bait[intervalsOpt as BaitKey];
    // deno-lint-ignore no-explicit-any
    const bait = (baits as any)[assembly] as string | undefined;
    if (!bait)
      throw new Error(
        `Bait Intervals of ${intervalsOpt} not found for ${assembly}`
      );
    return bait;
  }
  if (!existsSync(intervalsOpt)) {
    throw new Error(`Bait Intervals file ${intervalsOpt} not found`);
  }
  return intervalsOpt;
}

export const toIntervalScatter = (sample: string, assembly: SupportAssembly) =>
  `${sample}.${assembly}.interval_scatter`;
