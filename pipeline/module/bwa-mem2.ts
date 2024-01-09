import { checkDone } from "@/utils/check-done.ts";
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
  const { done, finish } = await checkDone(output, [forward, reverse], true);
  if (done) {
    console.info("Skipping bwa mem");
    return;
  }
  const bwaArgs = [
    ...(opts.bwaArgs ?? []),
    ...["-t", opts.threads, "-R", opts.readGroup],
    opts.reference,
  ];

  // Fixmate checks the two mates from a paired-end bam (name sorted) and then updates the flags and insert sizes. IMHO that only makes sense if you did any filtering on your bam. For example, I typically filter my bam (for ChIP-seq, ATAC-seq, these kind of assays) for properly-paired reads and MAPQ. In case filtering for MAPQ>30 removes the forward, but not the reverse mate, the actual read is no longer paired, even though the bitwise flag still indicates the remaining mate as such. Running fixmate will then flag this singleton as unpaired and remove the insert size field, which allows subsequent removal by e.g. samtools view -f 2. In your case, as you did align directly from fastq, I do not think that it is necessary. Just be sure in your subsequent SNV calling that you exclude reads with MAPQ=0, as these multimappers are unrealiable.
  if (opts.fixmate ?? false) {
    await $`bwa-mem2 mem ${bwaArgs} ${forward} ${reverse} \
  | samtools fixmate -@ ${opts.threads} -m - ${output}`;
  } else {
    await $`bwa-mem2 mem ${bwaArgs} ${forward} ${reverse} \
  | samtools view -@ ${opts.threads} - -bS -o ${output}`;
  }
  await finish();
}
