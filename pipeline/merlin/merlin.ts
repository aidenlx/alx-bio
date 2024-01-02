import {
  csvStringify,
  $,
  Command,
  EnumType,
  join,
  dirname,
  emptyDir,
  resolve,
  csvParse,
} from "@/deps.ts";
import getChrList from "@/utils/chr.ts";
import getSamples from "@/pipeline/final/get-samples.ts";
import { parsePedFile, stringifyPedFile } from "@/batch/ped.ts";
import { enumerate } from "@/utils/must-include.ts";
import { ThresholdType, defaultThreshold } from "./clamp.ts";
import { vcfFilter } from "./vcf-filter.ts";
import { extractRanges } from "@/pipeline/merlin/2bed.ts";
import { NonNegativeInt, PositiveInt } from "@/utils/validate.ts";
import { ensureDir } from "https://deno.land/std@0.194.0/fs/ensure_dir.ts";

/**
 * @see http://csg.sph.umich.edu/abecasis/merlin/reference/parametric.html
 */
interface DiseaseModel {
  // A label for the disease being modeled
  DISEASE: string;
  // The frequency of the disease allele in the population
  ALLELE_FREQ?: number;
  // The probability of being affected for individuals with 0, 1, and 2 copies of the disease allele
  PENETRANCES: [number, number, number];
  // A label for the analysis model (optional)
  LABEL?: string;
}

const diseaseModelColumns = enumerate<keyof DiseaseModel>()(
  "DISEASE",
  "ALLELE_FREQ",
  "PENETRANCES",
  "LABEL"
);

function toModelFile(...models: DiseaseModel[]): string {
  return csvStringify(
    models.map(({ PENETRANCES, ...rest }) => ({
      PENETRANCES: PENETRANCES.join(","),
      ...rest,
    })),
    {
      headers: false,
      crlf: false,
      separator: "\t",
      columns: diseaseModelColumns,
    }
  );
}

// https://mathgen.stats.ox.ac.uk/impute/1000GP_Phase3.tgz
// https://mathgen.stats.ox.ac.uk/impute/1000GP_Phase3_chrX.tgz
// (See the genetic_map_chr*_combined_b37.txt files, 3rd column)
// Which are listed in the website:
// https://mathgen.stats.ox.ac.uk/impute/1000GP_Phase3.html
// https://alkesgroup.broadinstitute.org/Eagle/downloads/tables/
const cmMapRes = {
  // hg19: "/Users/aidenlx/repo/alx-bio/slivar/repo/merlin-bi/genetic_map_b37/genetic_map_chr@.combined_b37.txt",
  // hg19: "/cluster/home/jiyuan/res/genetic_map/genetic_map_chr@.combined_hg19.txt",
  hg19: "/genetics/home/shiyan/bin/script/merlin_data/genetic_map_b37_2/genetic_map_chr@.combined_b37.txt",
  // hg38: "/cluster/home/jiyuan/res/genetic_map/genetic_map_chr@.combined_hg38.txt",
  hg38: "/genetics/home/shiyan/bin/script/merlin_data/genetic_map_b38/genetic_map_chr@.combined_b38.txt",
};

/**
 * dummy model to make sure every marker has an output
 */
const otherwiseModel: DiseaseModel = {
  DISEASE: "OTHERWISE",
  PENETRANCES: [0, 1, 1],
};
const merlinModels = {
  AR: {
    DISEASE: "VERY_RARE_DISEASE",
    ALLELE_FREQ: 0.0001,
    PENETRANCES: [0, 0, 1],
    LABEL: "Recessive_Model",
  },
  AD: {
    DISEASE: "VERY_RARE_DISEASE",
    ALLELE_FREQ: 0.0001,
    PENETRANCES: [0.0001, 1, 1],
    LABEL: "Dominant_Model",
  },
} satisfies Record<string, DiseaseModel>;

const model = new EnumType(["AR", "AD"]);
const assembly = new EnumType(["hs37", "hg38"]);

export const awkTsv = `BEGIN { FS = OFS = "\\t" }`;

export default new Command()
  .name("merlin")
  .type("model", model)
  .type("assembly", assembly)
  .type("threshold", new ThresholdType())
  .type("positive-integer", PositiveInt)
  .type("non-negative-integer", NonNegativeInt)
  // .option("-i, --input <file:string>", "input vcf(.gz) file")
  .option("-o, --output <prefix:string>", "output prefix")
  .option("-p, --ped <file:string>", "pedigree file", { required: true })
  .option("-m, --model <type:model>", "disease model", {
    default: "AD" as const,
  })
  .option("-M, --model-file <file:string>", "disease model file")
  .option("-r, --ref <type:assembly>", "reference genome", { required: true })
  .option("-c, --cm <value:integer>", "centimorgan (cM)", { default: 0 })
  .option("--no-cleanup", "do not clean up intermediate files")
  .option("-t, --threshold <value:threshold>", "threshold for cm filtering", {
    default: defaultThreshold,
  })
  .option("--min-range-width <value:positive-integer>", "minimal range width")
  .option("--offset <value:non-negative-integer>", "offset for range width", {
    default: 0,
  })
  .arguments("<input_vcf>")
  .action(async (opts, input) => {
    const outPrefix = opts.output ?? input.replace(/\.vcf(\.gz)?$/, "");
    // const tempDir = await Deno.makeTempDir({ prefix: "merlin_" });
    const tempDir = resolve(join(dirname(outPrefix), ".merlin"));
    await Promise.all([emptyDir(tempDir), ensureDir(dirname(outPrefix))]);

    // extract directly relavant individuals that has data available in vcf
    const relavantPedFile = join(tempDir, "relevant.ped");
    const samples = await getSamples(input);
    const fullPed = await Deno.readTextFile(opts.ped).then(parsePedFile);

    const relevantPed = samples.flatMap((n) => {
      const ped = fullPed.find((v) => v.indId === n);
      if (!ped) {return []}
      return [ped];
    });

    await Deno.writeTextFile(relavantPedFile, stringifyPedFile(relevantPed));

    // const relatedPedFile = join(tempDir, "parent.ped");
    // const relatedPed = findParents(relevantPed, fullPed);
    // await Deno.writeTextFile(relatedPedFile, stringifyPedFile(relatedPed));

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
    const halfCallOpts = [
      ...["--vcf-half-call", "missing"],
      ...["--set-missing-var-ids", "@:#[b37]$1,$2"],
      ...["--new-id-max-allele-len", "50"],
    ];
    await $`plink --vcf ${chrOnlyVcf} --cm-map ${cmMap} --make-just-bim ${halfCallOpts} --out ${cmFilterBimPrefix}`;
    const cmFilterBim = `${cmFilterBimPrefix}.bim`;

    const filterVcf = join(tempDir, "filter.vcf.gz");
    await vcfFilter([chrOnlyVcf, cmFilterBim], filterVcf, {
      cmThreshold: opts.cm,
      chrPrefix,
    });

    const initialOutPrefix = join(tempDir, "initial");
    await $`plink --vcf ${filterVcf} --cm-map ${cmMap} --recode --out ${initialOutPrefix}`;
    const map = `${initialOutPrefix}.map`,
      mapOut = `${outPrefix}.map`;
    const toMerlinMap = `${awkTsv} { print $1, "chr" $1 ":" $4, $3 }`;
    const MerlinMapHeader = ["CHROMOSOME", "MARKER", "POSITION"].join("\t");
    await $`(echo ${MerlinMapHeader}; awk ${toMerlinMap} ${map}) > ${mapOut}`;

    const ped = `${initialOutPrefix}.ped`,
      pedPheno = `${outPrefix}.pheno.ped`;
    await $`cut -f7- -d' ' ${ped} | tr ' ' '\\t'\
| paste <(
  matrixextend \
    k2 c1-6 ${relavantPedFile} \
    k1 <(cut -f2 -d' ' ${ped}) \
    | cut -f2-
  ) - \
| grep -v '^NULL' \
> ${pedPheno}`.nothrow();
    const datPheno = `${outPrefix}.pheno.dat`;
    const toMerlinDat = `${awkTsv} { print "M", "chr" $1 ":" $4 }`;
    const MerlinDatHeader = ["A", "VERY_RARE_DISEASE"].join("\t");
    await $`(echo ${MerlinDatHeader}; awk ${toMerlinDat} ${map}) > ${datPheno}`;

    const modelFile = outPrefix + ".merlin.model";

    let primaryModel: string | undefined;
    if (opts.modelFile) {
      const modelsRaw = await Deno.readTextFile(opts.modelFile);
      const models = csvParse(modelsRaw, {
        skipFirstRow: false,
        columns: diseaseModelColumns,
        separator: "\t",
      });
      if (models.length === 0) {
        throw new Error("no model found in model file " + opts.modelFile);
      }
      primaryModel = models[0].LABEL || undefined;
      await Deno.writeTextFile(
        modelFile,
        modelsRaw.trim() + "\n" + toModelFile(otherwiseModel)
      );
    } else {
      const model = merlinModels[opts.model];
      primaryModel = model.LABEL;
      await Deno.writeTextFile(modelFile, toModelFile(model, otherwiseModel));
    }

    // https://www.biostars.org/p/172382/
    // provide additional family structure information
    // to avoid Merlin's error: "Parent is missing"
    const pedFam = `${outPrefix}.fam.ped`;
    await $`cp -f ${opts.ped} ${pedFam}`;
    // provide a dummy dat file here
    const datFam = `${outPrefix}.fam.dat`;
    await Deno.writeTextFile(datFam, MerlinDatHeader);

    const flags = ["--markerNames", "--pdf", "--tabulate"];

    const merlinPrefix = `${outPrefix}.merlin`;

    const merlin =
      await $`merlin -d ${datFam},${datPheno} -p ${pedFam},${pedPheno} -m ${mapOut} --model ${modelFile} ${flags} --prefix ${merlinPrefix}`;
    if (merlin.exitCode !== 0) {
      throw new Error("merlin failed");
    }

    const partblFile = `${merlinPrefix}-parametric.tbl`;
    const outputBed = `${merlinPrefix}.bed`;

    await extractRanges(partblFile, outputBed, {
      threshold: opts.threshold,
      minRangeWidth: opts.minRangeWidth,
      offset: opts.offset,
      model: primaryModel,
      chrPrefix: opts.ref === "hg38",
    });

    if (opts.cleanup) {
      await $`rm -rf ${tempDir}`;
    }
  });
