import { checkDone } from "@/utils/check-done.ts";
import { GATKOptions, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKSplitIntervals(
  intervals: string,
  output: string,
  options: GATKOptions & {
    scatterCount: number;
    reference: string;
    intervalPadding?: number;
    quiet?: boolean;
  },
) {
  const { done, finish } = await checkDone(output, intervals, true);
  if (done) {
    console.error("Skipping BaseRecalibrator");
    return;
  }

  const args = [
    ...(options.args ?? []),
    ...[
      "--reference",
      options.reference,
      "--scatter-count",
      options.scatterCount,
    ],
    ...(options.intervalPadding
      ? [`--interval-padding`, options.intervalPadding]
      : []),
    ...["--intervals", intervals, "-O", output],
    options.quiet ? "--QUIET" : "",
  ];

  await $`gatk ${java(options)} SplitIntervals ${args}`;
  await finish();
}
