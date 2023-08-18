import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";
import filters from "./filter.json" assert { type: "json" };
import { softFilterKey } from "@/pipeline/module/filter.ts";

/**
 * @returns When no output filename is specified, for a CRAM file aln.cram, index file aln.cram.crai will be created; for a BAM file aln.bam, either aln.bam.bai or aln.bam.csi will be created; and for a compressed SAM file aln.sam.gz, either aln.sam.gz.bai or aln.sam.gz.csi will be created, depending on the index format selected.
 */
export default async function genQC(inputVcfGz: string, outputVcfGz: string) {
  const { done, finish } = await checkDone(outputVcfGz, inputVcfGz);
  if (done) {
    console.info("Skipping qc vcf gen");
    return outputVcfGz;
  }
  if (outputVcfGz.endsWith(".gz")) {
    // -t q: This is an option for the plugin +setGT, specifically the -t option followed by q. It specifies the type of modification to perform, where "q" indicates that the genotypes should be set to missing values (".") for the selected sites.
    // -n .: This is an option for the plugin +setGT, specifically the -n option followed by a dot ".". It specifies the number of alleles, where a dot "." represents an unspecified number of alleles.
    await $`bcftools view -f ${softFilterKey} ${inputVcfGz} \
| bcftools +setGT -Oz -- -t q -n . -i ${filters.hardFilterGTMissing} \
> ${outputVcfGz} \
&& tabix -f -p vcf ${outputVcfGz}`;
  } else {
    throw new Error("outputVcfGz must end with .gz");
  }
  await finish();
  return outputVcfGz;
}
