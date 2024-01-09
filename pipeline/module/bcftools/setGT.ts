import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

/**
 * @returns When no output filename is specified, for a CRAM file aln.cram, index file aln.cram.crai will be created; for a BAM file aln.bam, either aln.bam.bai or aln.bam.csi will be created; and for a compressed SAM file aln.sam.gz, either aln.sam.gz.bai or aln.sam.gz.csi will be created, depending on the index format selected.
 */
export default async function bcftoolsSetGT(
  input: string,
  output: string,
  options: {
    args?: string[];
    pluginArgs?: string[];
    include?: string;
  } = {}
) {
  const { done, finish } = await checkDone(output, input);
  if (done) {
    console.error("Skipping bcftools setgt");
    return output;
  }
  const args = [...(options.args ?? [])];
  const pluginArgs = [
    ...(options.pluginArgs ?? []),
    ...(options.include ? ["-i", options.include] : []),
  ];
  if (output.endsWith(".gz")) {
    await $`bcftools +setGT ${args} ${input} -Oz -- ${pluginArgs} > ${output} && tabix -f -p vcf ${output}`;
  } else {
    await $`bcftools +setGT ${args} ${input} -- ${pluginArgs} > ${output}`;
  }
  await finish();
}
