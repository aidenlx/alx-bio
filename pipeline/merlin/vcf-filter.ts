import {
  $, join,
  dirname
} from "@/deps.ts";
import { awkTsv } from "./merlin.ts";

/**
 * @param outputPosGz The columns of the tab-delimited file can
 * contain positions (two-column format: CHROM, POS).
 * Positions are 1-based and inclusive.
 */

async function cleanCm2(
  inputBim: string,
  outputPosGz: string,
  { threshold, chrPrefix }: { threshold: number; chrPrefix: boolean; }
) {
  const query = `${awkTsv}
{
  chr = $1;
  cm_pos = $3;
  pos = $4;

  if (lastPositions[chr] == "") {
    lastPositions[chr] = 0;
  }

  if (cm_pos - lastPositions[chr] > ${threshold}) {
    sub(/^chr/, "", chr);
    print ${chrPrefix ? '"chr"' : ""}chr, pos;
    lastPositions[chr] = cm_pos;
  }
}
`.trim();
  await $`awk ${query} ${inputBim} | bgzip > ${outputPosGz} && tabix -s 1 -b 2 -e 2 ${outputPosGz}`;
}
export async function vcfFilter(
  [inputVcf, bimFile]: [inputVcf: string, bimFile: string],
  output: string,
  { cmThreshold, chrPrefix }: { cmThreshold: number; chrPrefix: boolean; }
) {
  // https://samtools.github.io/bcftools/bcftools.html#:~:text=%2DR.-,%2DR%2C%20%2D%2Dregions%2Dfile,-FILE
  const passedVariantsPos = join(dirname(output), "cm-passed.pos.gz");
  await cleanCm2(bimFile, passedVariantsPos, {
    threshold: cmThreshold,
    chrPrefix,
  });
  await $`[ ! -f ${inputVcf}.tbi ] && tabix ${inputVcf} || true`;

  // let bcftools handle site filtering, and vcftools handle genotype filtering (set GT to missing if GQ < 80)
  const siteFilter = "TYPE='snp' & QUAL >= 40 & AVG(FORMAT/DP) >= 10";
  const genotypeFilter = ["--minGQ", 80, "--max-missing", 0.8];
  // const siteFilter = "QUAL >= 40 & AVG(FORMAT/DP) >= 10";
  // const genotypeFilter = [
  //   "--remove-indels",
  //   ...["--minGQ", 80],
  //   ...["--max-missing", 0.8],
  // ];
  await $`bcftools view ${inputVcf} -i ${siteFilter} --targets-file ${passedVariantsPos} \
  | vcftools --vcf - ${genotypeFilter} --recode --recode-INFO-all --stdout | bgzip > ${output}`;
}
