import { checkDone } from "@/utils/check-done.ts";
import { GATKOptions, gatkTempDir, gatkTempDirJava, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKMarkDuplicatesSpark(
  input: string,
  { bam, metrics }: { bam: string; metrics: string },
  options: GATKOptions & {
    threads: number;
    removeAllDuplicates?: boolean;
    removeSequencingDuplicates?: boolean;
  }
) {
  const { done, finish } = await checkDone(bam, input, true);
  if (done) {
    console.info("Skipping MarkDuplicates");
    return;
  }

  options.javaOptions = [
    ...(options.javaOptions ?? []),
    "-Xms60G",
    "-Xmx60G",
    gatkTempDirJava(),
  ];

  const args = [
    ...(options.args ?? []),
    ...[
      "--spark-master",
      `local[${options.threads}]`,
    ],
    ...gatkTempDir(),
    ...(options.removeAllDuplicates
      ? [
          "--remove-all-duplicates",
          String(options.removeAllDuplicates ?? false),
        ]
      : []),
    ...(options.removeSequencingDuplicates
      ? [
          "--remove-sequencing-duplicates",
          String(options.removeSequencingDuplicates ?? false),
        ]
      : []),
    ...["-I", input, "-O", bam, "-M", metrics],
  ];

  await $`gatk ${java(options)} MarkDuplicatesSpark ${args}`;
  await finish();
}
