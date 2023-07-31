import { checkDoneV2 } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export const required = ["bwa-mem2", "samtools"];

export default async function bwaMem2(
  [forward, reverse]: [string, string],
  output: string,
  opts: {
    threads: number;
    /** fasta file */
    reference: string;
    readGroup: string;
    bwaArgs?: string[];
    fixmate?: boolean;
  }
) {
  const { done, finish } = await checkDoneV2(
    output,
    [forward, reverse],
    output
  );
  if (done) {
    console.info("Skipping bwa mem");
    return;
  }
  const bwaArgs = [
    ...(opts.bwaArgs ?? []),
    ...["-t", opts.threads, "-R", opts.readGroup],
    opts.reference,
  ];

  if (opts.fixmate ?? true) {
    await $`bwa-mem2 mem ${bwaArgs} ${forward} ${reverse} \
  | samtools fixmate -@ ${opts.threads} -m - ${output}`;
  } else {
    await $`bwa-mem2 mem ${bwaArgs} ${forward} ${reverse} \
  | samtools view -@ ${opts.threads} - -bS -o ${output}`;
  }
  await finish();
}
