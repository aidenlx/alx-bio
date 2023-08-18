import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

/**
 * @returns When no output filename is specified, for a CRAM file aln.cram, index file aln.cram.crai will be created; for a BAM file aln.bam, either aln.bam.bai or aln.bam.csi will be created; and for a compressed SAM file aln.sam.gz, either aln.sam.gz.bai or aln.sam.gz.csi will be created, depending on the index format selected.
 */
export default async function bcftoolsFilter(
  input: string,
  output: string,
  options: {
    include?: string;
    exclude?: string;
    softFilter?: string;
    args?: string[];
  } = {}
) {
  const { done, finish } = await checkDone(output, input);
  if (done) {
    console.info("Skipping bcftools filter");
    return output;
  }
  const args = [
    ...(options.args ?? []),
    ...(options.include ? ["-i", options.include] : []),
    ...(options.exclude ? ["-e", options.exclude] : []),
    ...(options.softFilter ? ["-s", options.softFilter] : []),
  ];
  if (output.endsWith(".gz")) {
    await $`bcftools filter ${args} ${input} | bgzip > ${output} && tabix -f -p vcf ${output}`;
  } else {
    await $`bcftools filter ${args} ${input} > ${output}`;
  }
  await finish();
}
