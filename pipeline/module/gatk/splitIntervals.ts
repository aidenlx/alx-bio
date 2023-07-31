import { checkDoneV2 } from "@/utils/check-done.ts";
import { GATKOptions, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKSplitIntervals(
  intervals: string,
  output: string,
  options: GATKOptions & {
    threads: number;
    reference: string;
    intervalPadding: number;
    quiet?: boolean;
  }
) {
  const { done, finish } = await checkDoneV2(output, intervals, output);
  if (done) {
    console.info("Skipping BaseRecalibrator");
    return;
  }

  const args = [
    ...(options.args ?? []),
    ...[
      "--reference",
      options.reference,
      `--interval-padding`,
      options.intervalPadding,
      "--scatter-count",
      options.threads,
    ],
    ...["--intervals", intervals, "-O", output],
    options.quiet ? "--QUIET" : "",
  ];

  await $`gatk ${java(options)} SplitIntervals ${args}`;
  await finish();
}
