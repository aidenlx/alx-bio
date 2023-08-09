import {
  csvStringify,
  $,
  Command,
  EnumType,
  join,
  dirname,
  emptyDir,
  resolve,
} from "@/deps.ts";
import getChrList from "@/utils/chr.ts";
import getSamples from "@/pipeline/final/get-samples.ts";
import { parsePedFile, stringifyPedFile } from "@/batch/ped.ts";

/**
 * @see http://csg.sph.umich.edu/abecasis/merlin/reference/parametric.html
 */
interface DiseaseModel {
  // A label for the disease being modeled
  DISEASE: string;
  // The frequency of the disease allele in the population
  ALLELE_FREQ: number;
  // The probability of being affected for individuals with 0, 1, and 2 copies of the disease allele
  PENETRANCES: [number, number, number];
  // A label for the analysis model (optional)
  LABEL: string;
}

function toModelFile(
  ...models: (DiseaseModel & Record<string, DiseaseModel[keyof DiseaseModel]>)[]
): string {
  return csvStringify(
    models.map(({ PENETRANCES, ...rest }) => ({
      PENETRANCES: PENETRANCES.join(","),
      ...rest,
    })),
    {
      headers: false,
      crlf: false,
      separator: "\t",
      columns: [
        "DISEASE",
        "ALLELE_FREQ",
        "PENETRANCES",
        "LABEL",
      ] as (keyof DiseaseModel)[],
    }
  );
}

// https://alkesgroup.broadinstitute.org/Eagle/downloads/tables/
const cmMapRes = {
  hg19: "/cluster/home/jiyuan/res/genetic_map/genetic_map_chr@.combined_hg19.txt",
  // hg19: "/genetics/home/shiyan/bin/script/merlin_data/genetic_map_b37_2/genetic_map_chr@.combined_b37.txt",
  hg38: "/cluster/home/jiyuan/res/genetic_map/genetic_map_chr@.combined_hg38.txt",
};
const merlinModels = {
  AR: toModelFile({
    DISEASE: "VERY_RARE_DISEASE",
    ALLELE_FREQ: 0.0001,
    PENETRANCES: [0, 0, 1],
    LABEL: "Recessive_Model",
  }),
  AD: toModelFile({
    DISEASE: "VERY_RARE_DISEASE",
    ALLELE_FREQ: 0.0001,
    PENETRANCES: [0.0001, 1, 1],
    LABEL: "Dominant_Model",
  }),
};

const model = new EnumType(["AR", "AD"]);
const assembly = new EnumType(["hs37", "hg38"]);

const awkTsv = `BEGIN { FS = OFS = "\\t" }`;

export default new Command()
  .name("merlin")
  .type("model", model)
  .type("assembly", assembly)
  // .option("-i, --input <file:string>", "input vcf(.gz) file")
  .option("-o, --output <prefix:string>", "output prefix")
  .option("-p, --ped <file:string>", "pedigree file", { required: true })
  .option("-m, --model <type:model>", "disease model", {
    default: "AD" as const,
  })
  .option("-r, --ref <type:assembly>", "reference genome", { required: true })
  .option("-c, --cm <value:integer>", "centimorgan (cM)", { default: 0 })
  .option("--no-cleanup", "do not clean up intermediate files")
  .arguments("<input_vcf>")
  .action(async (opts, input) => {
    const outPrefix = opts.output ?? input.replace(/\.vcf(\.gz)?$/, "");
    // const tempDir = await Deno.makeTempDir({ prefix: "merlin_" });
    const tempDir = resolve(join(dirname(outPrefix), ".merlin"));
    await emptyDir(tempDir);

    // extract relavant individuals that has data available in vcf
    const relavantPed = join(tempDir, "relavant.ped");
    const samples = new Set(await getSamples(input));
    const fullPed = await Deno.readTextFile(opts.ped).then(parsePedFile);
    await Deno.writeTextFile(
      relavantPed,
      stringifyPedFile(fullPed.filter((v) => samples.has(v.indId))).trim()
    );

    const inputVcf = await (async (input: string) => {
      input = resolve(input);
      let symlinked;
      if (input.endsWith(".gz")) {
        symlinked = join(tempDir, "input.vcf.gz");
        await Promise.all([
          $`ln -sf ${input} ${symlinked}`,
          $`[ -f ${input}.tbi ] && ln -sf ${input}.tbi ${symlinked}.tbi || tabix ${symlinked}`,
        ]);
      } else {
        symlinked = join(tempDir, "input.vcf");
        await $`ln -sf ${input} ${symlinked}`;
      }
      return symlinked;
    })(input);

    // keep only chr1-22,X,Y
    const chrOnlyVcf = join(tempDir, "chr-only.vcf.gz");
    const chrPrefix = opts.ref !== "hs37";
    const chrList = getChrList(chrPrefix).join(",");
    await $`[ ! -f ${inputVcf}.tbi ] && tabix -p vcf ${inputVcf} || true`;
    await $`bcftools view -r ${chrList} ${inputVcf} -Oz -o ${chrOnlyVcf} && tabix ${chrOnlyVcf}`;

    const cmMap = cmMapRes[opts.ref === "hs37" ? "hg19" : opts.ref];
    const cmFilterBimPrefix = join(tempDir, "cm-filter");
    await $`plink --vcf ${chrOnlyVcf} --cm-map ${cmMap} --make-just-bim --out ${cmFilterBimPrefix}`;
    const cmFilterBim = `${cmFilterBimPrefix}.bim`;

    const filterVcf = join(tempDir, "filter.vcf.gz");
    await vcfFilter([chrOnlyVcf, cmFilterBim], filterVcf, {
      cmThreshold: opts.cm,
      chrPrefix,
    });

    const cvtPrefix = join(tempDir, "convert");
    await $`plink --vcf ${filterVcf} --make-bed --out ${cvtPrefix}`;
    const cvtFam = `${cvtPrefix}.fam`;
    await $`cp -f ${relavantPed} ${cvtFam}`;
    const initialOutPrefix = join(tempDir, "initial");
    await $`plink --bfile ${cvtPrefix} --cm-map ${cmMap} --recode --out ${initialOutPrefix}`;

    const map = `${initialOutPrefix}.map`,
      mapOut = `${outPrefix}.map`;
    const toMerlinMap = `${awkTsv} { print $1, "chr" $1 ":" $4, $3 }`;
    const MerlinMapHeader = ["CHROMOSOME", "MARKER", "POSITION"].join("\t");
    await $`(echo ${MerlinMapHeader}; awk ${toMerlinMap} ${map}) > ${mapOut}`;

    const ped = `${initialOutPrefix}.ped`,
      pedPheno = `${outPrefix}.pheno.ped`;
    await $`cp -f ${ped} ${pedPheno}`

    const datPheno = `${outPrefix}.pheno.dat`;
    const toMerlinDat = `${awkTsv} { print "M", "chr" $1 ":" $4 }`;
    const MerlinDatHeader = ["A", "VERY_RARE_DISEASE"].join("\t");
    await $`(echo ${MerlinDatHeader}; awk ${toMerlinDat} ${map}) > ${datPheno}`;

    const model = outPrefix + ".merlin.model";
    await Deno.writeTextFile(model, merlinModels[opts.model]);

    // https://www.biostars.org/p/172382/
    // provide additional family structure information
    // to avoid Merlin's error: "Parent is missing"
    const pedFam = `${outPrefix}.fam.ped`;
    await $`cp -f ${opts.ped} ${pedFam}`;
    // provide a dummy dat file here
    const datFam = `${outPrefix}.fam.dat`;
    await Deno.writeTextFile(datFam, MerlinDatHeader);

    await $`merlin -d ${datFam},${datPheno} -p ${pedFam},${pedPheno} -m ${mapOut} --model ${model} --grid 1 --markerNames --pdf --tabulate --prefix ${outPrefix}.merlin`;
    if (opts.cleanup) {
      await $`rm -rf ${tempDir}`;
    }
  });

/**
 * @param outputPosGz The columns of the tab-delimited file can
 * contain positions (two-column format: CHROM, POS).
 * Positions are 1-based and inclusive.
 */
async function cleanCm2(
  inputBim: string,
  outputPosGz: string,
  { threshold, chrPrefix }: { threshold: number; chrPrefix: boolean }
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

async function vcfFilter(
  [inputVcf, bimFile]: [inputVcf: string, bimFile: string],
  output: string,
  { cmThreshold, chrPrefix }: { cmThreshold: number; chrPrefix: boolean }
) {
  // https://samtools.github.io/bcftools/bcftools.html#:~:text=%2DR.-,%2DR%2C%20%2D%2Dregions%2Dfile,-FILE
  const passedVariantsPos = join(dirname(output), "cm-passed.pos.gz");
  await cleanCm2(bimFile, passedVariantsPos, {
    threshold: cmThreshold,
    chrPrefix,
  });
  await $`[ ! -f ${inputVcf}.tbi ] && tabix ${inputVcf} || true`;

  // vcftools --minGQ 80 --remove-indels --minQ 40 --min-meanDP 10 --max-missing 0.8
  const query =
    "TYPE='snp' & GQ >= 80 & QUAL >= 40 & AVG(FORMAT/DP) >= 10 & F_MISSING <= 0.2";

  await $`bcftools view ${inputVcf} -i ${query} --regions-file ${passedVariantsPos} -Oz -o ${output}`;
}
