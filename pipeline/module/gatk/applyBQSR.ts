import { checkDone } from "@/utils/check-done.ts";
import { GATKOptions, gatkTempDir, gatkTempDirJava, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKApplyBQSR(
  { bam, bqsr }: { bam: string; bqsr: string },
  output: string,
  opts: GATKOptions & {
    reference: string;
  }
) {
  const { done, finish } = await checkDone(output, [bam, bqsr], true);
  if (done) {
    console.error("Skipping ApplyBQSR");
    return;
  }

  /** https://hpc.nih.gov/training/gatk_tutorial/bqsr.html#benchmarks-of-applybqsr */
  opts.javaOptions = [
    ...(opts.javaOptions ?? []),
    "-Xmx2G",
    "-Xms2G",
    "-XX:ParallelGCThreads=2",
    gatkTempDirJava(),
  ];

  const args = [
    ...(opts.args ?? []),
    ...gatkTempDir(),
    ...["-R", opts.reference],
    ...["-bqsr", bqsr, "-I", bam, "-O", output],
  ];
  await $`gatk ${java(opts)} ApplyBQSR ${args}`;
  await finish();
}
