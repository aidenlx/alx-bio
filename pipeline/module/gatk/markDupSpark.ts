import { checkDone, optOptional } from "@/utils/check-done.ts";
import { GATKOptions, gatkTempDir, gatkTempDirJava, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKMarkDuplicatesSpark(
  input: string,
  { bam, metrics }: { bam: string; metrics?: string },
  options: GATKOptions & {
    threads: number;
    removeAllDuplicates?: boolean;
    removeSequencingDuplicates?: boolean;
  },
) {
  const { done, finish } = await checkDone(bam, input, true);
  if (done) {
    console.error("Skipping MarkDuplicates");
    return;
  }

  options.javaOptions = [
    ...(options.javaOptions ?? []),
    "-Xms120G",
    "-Xmx120G",
    gatkTempDirJava(),
  ];

  const args = [
    ...(options.args ?? []),
    ...optOptional(options.threads, (cores) => [
      "--conf",
      `spark.executor.cores=${cores}`,
    ]),
    ...gatkTempDir(),
    ...optOptional(options.removeAllDuplicates, (bool) => [
      "--remove-all-duplicates",
      String(bool ?? false),
    ]),
    ...optOptional(options.removeSequencingDuplicates, (bool) => [
      "--remove-sequencing-duplicates",
      String(bool ?? false),
    ]),
    ...["-I", input, "-O", bam],
    ...(metrics ? ["-M", metrics] : []),
  ];

  await $`srun gatk ${java(options)} MarkDuplicatesSpark ${args}`;
  await finish();
}
