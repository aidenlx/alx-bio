import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

/**
 * @returns When no output filename is specified, for a CRAM file aln.cram, index file aln.cram.crai will be created; for a BAM file aln.bam, either aln.bam.bai or aln.bam.csi will be created; and for a compressed SAM file aln.sam.gz, either aln.sam.gz.bai or aln.sam.gz.csi will be created, depending on the index format selected.
 */
export default async function bcftoolsNorm(
  input: string,
  output: string,
  options: {
    fastaRef?: string;
    args?: string[];
  } = {}
) {
  const { done, finish } = await checkDone(output, input, true);
  if (done) {
    console.error("Skipping bcftools norm");
    return output;
  }
  const args = [
    ...(options.args ?? []),
    ...["-m", "-both"],
    ...(options.fastaRef ? ["-f", options.fastaRef] : []),
  ];
  if (output.endsWith(".gz")) {
    await $`bcftools norm ${args} ${input} | bgzip > ${output} && tabix -f -p vcf ${output}`;
  } else {
    await $`bcftools norm ${args} ${input} > ${output}`;
  }
  await finish();
}
