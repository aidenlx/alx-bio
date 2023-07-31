import { checkDoneV2 } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";
export { required } from "./_common.ts";

/**
 * @returns When no output filename is specified, for a CRAM file aln.cram, index file aln.cram.crai will be created; for a BAM file aln.bam, either aln.bam.bai or aln.bam.csi will be created; and for a compressed SAM file aln.sam.gz, either aln.sam.gz.bai or aln.sam.gz.csi will be created, depending on the index format selected.
 */
export default async function samtoolsIndex(
  input: string,
  options: {
    threads: number;
    args?: string[];
  }
): Promise<string> {
  const output = `${input}.bai`;
  const { done, finish } = await checkDoneV2(output, input, output);
  if (done) {
    console.info("Skipping samtools index");
    return output;
  }
  const args = [...(options.args ?? []), ...["-@", options.threads]];
  await $`samtools index ${args} ${input}`;
  await finish();
  return output;
}
