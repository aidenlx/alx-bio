import { checkDone } from "@/utils/check-done.ts";
import { GATKOptions, gatkTempDir, gatkTempDirJava, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKCollectHsMetrics(
  inputBam: string,
  output: string,
  opts: GATKOptions & {
    baitIntervals: string;
    targetIntervals: string;
    ref: string;
  }
) {
  const { done, finish } = await checkDone(output, inputBam, true);
  if (done) {
    console.info("Skipping CollectHsMetrics");
    return;
  }

  opts.javaOptions = [...(opts.javaOptions ?? []), gatkTempDirJava()];

  const args = opts.args ?? [
    ...gatkTempDir(true),
    ...["-R", opts.ref],
    ...["--BAIT_INTERVALS", opts.baitIntervals],
    ...["--TARGET_INTERVALS", opts.targetIntervals],
  ];

  await $`gatk ${java(
    opts
  )} CollectHsMetrics -I ${inputBam} -O ${output} ${args}`;
  await finish();
}
