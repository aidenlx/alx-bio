import { checkDoneV2 } from "@/utils/check-done.ts";
import {
  GATKOptions,
  gatkTempDir,
  gatkTempDirJava,
  toJavaOptions,
} from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKCollectHsMetrics(
  inputBam: string,
  output: string,
  options: GATKOptions & {
    baitIntervals: string;
    targetIntervals: string;
    ref: string;
  }
) {
  const { done, finish } = await checkDoneV2(output, inputBam, output);
  if (done) {
    console.info("Skipping CollectHsMetrics");
    return;
  }

  options.javaOptions = [...(options.javaOptions ?? []), gatkTempDirJava()];

  const args = options.args ?? [
    ...gatkTempDir(true),
    ...["-R", options.ref],
    ...["--BAIT_INTERVALS", options.baitIntervals],
    ...["--TARGET_INTERVALS", options.targetIntervals],
  ];

  await $`gatk ${toJavaOptions(
    options
  )} CollectHsMetrics -I ${inputBam} -O ${output} ${args}`;
  await finish();
}
