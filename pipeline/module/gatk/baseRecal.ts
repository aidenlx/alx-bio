import { checkDoneV2 } from "@/utils/check-done.ts";
import { GATKOptions, gatkTempDirJava, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKBaseRecalibrator(
  input: string,
  output: string,
  opts: GATKOptions & {
    reference: string;
    knownSites: string[];
    intervals?: string;
    intervalPadding?: number;
    quiet?: boolean;
  }
) {
  const { done, finish } = await checkDoneV2(output, input, output);
  if (done) {
    console.info(`Skipping BaseRecalibrator ${output}`);
    return;
  }
  const knownSites = opts.knownSites.flatMap((file) => [`--known-sites`, file]);

  /** https://hpc.nih.gov/training/gatk_tutorial/bqsr.html#optimized-script-for-baserecalibrator */
  opts.javaOptions = [
    ...(opts.javaOptions ?? []),
    "-Xmx4G",
    "-Xms4G",
    "-XX:ParallelGCThreads=2",
    gatkTempDirJava(),
  ];

  const args = [
    ...(opts.args ?? []),
    // ...gatkTempDir(),
    ...["-R", opts.reference],
    ...knownSites,
    ...["-I", input, "-O", output],
    opts.quiet ? "--QUIET" : "",
  ];
  const intervalArgs = [
    ...(opts.intervals ? ["--intervals", opts.intervals] : []),
    ...(opts.intervalPadding
      ? [`--interval-padding`, opts.intervalPadding]
      : []),
  ];

  await $`gatk ${java(opts)}  BaseRecalibrator ${args} ${intervalArgs}`;
  await finish();
}
