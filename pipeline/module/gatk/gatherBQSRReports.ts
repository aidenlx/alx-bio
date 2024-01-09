import { checkDone } from "@/utils/check-done.ts";
import { GATKOptions, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKGatherBQSRReports(
  inputs: string[],
  output: string,
  options: GATKOptions
) {
  const { done, finish } = await checkDone(output, inputs, true);
  if (done) {
    console.error("Skipping GatherBQSRReports");
    return;
  }

  const args = [
    ...(options.args ?? []),
    ...inputs.flatMap((file) => ["--input", file]),
    ...["-O", output],
  ];
  await $`gatk ${java(options)} GatherBQSRReports ${args}`;
  await finish();
}
