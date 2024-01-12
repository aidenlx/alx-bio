import { checkDone } from "@/utils/check-done.ts";
import { GATKOptions, gatkTempDir, gatkTempDirJava, java } from "./_common.ts";
import { $ } from "@/deps.ts";
export { required } from "./_common.ts";

export default async function GATKSetNmMdAndUqTags(
  input: string,
  output: string,
  opts: GATKOptions & {
    reference: string;
  },
) {
  const { done, finish } = await checkDone(output, input);
  if (done) {
    console.error("Skipping SetNmMdAndUqTags");
    return;
  }

  opts.javaOptions = [
    ...(opts.javaOptions ?? []),
    "-Xmx4G",
    "-Xms4G",
    "-XX:ParallelGCThreads=2",
    gatkTempDirJava(),
  ];

  const args = [
    ...(opts.args ?? []),
    ...gatkTempDir(),
    ...["--reference", opts.reference],
    ...["-I", input],
    ...["--output", output],
  ];
  await $`gatk ${java(opts)} SetNmMdAndUqTags ${args}`;
  await finish();
}
