import { Command } from "@/deps.ts";
import { genomeAssembly } from "@/modules/common.ts";
import extract, { loadHpoData } from "@/pipeline/final/hpo-annot.ts";
import getSamples from "@/pipeline/final/get-samples.ts";
import tsv2excel from "@/pipeline/final/tsv2excel.ts";
import { finalVersion } from "@/pipeline/snv-final.ts";
import bcftoolsView from "@/pipeline/module/bcftools/view.ts";

export default new Command()
  .name("snv.extract")
  .description(
    "Extract from annotated full.vcf.gz to tab-delimited table and Excel ready table"
  )
  .type("genomeAssembly", genomeAssembly)
  .option("-r, --ref <genome:genomeAssembly>", "Genome assembly", {
    required: true,
  })
  .option("--resource <dir:string>", "Path to Resource", {
    default: "/genetics/home/stu_liujiyuan/alx-bio/deno-csv/res/",
  })
  .option("--no-local", "Do not extract local database")
  .option("--slivar", "Extract slivar fields")
  .option("--slivar-ch", "Extract slivar fields from result of compound-hets")
  .option("-i, --input <vcf:string>", "Input full.*.vcf.gz", { required: true })
  .option("-o, --output-base <base:string>", "Output base name")
  .option("--sample-map <file:string>", "Sample name mapping file")
  .option("--regions-file <FILE:string>", "restrict to regions listed in FILE")
  .action(
    async ({
      input,
      resource: resDir,
      ref: assembly,
      outputBase,
      sampleMap,
      local,
      slivar,
      slivarCh,
      regionsFile,
    }) => {
      const commonSuffix = `${finalVersion}.${assembly}`;
      /** should replace .vcf or .vcf.gz, also replace .$ref before extension if present */
      outputBase =
        outputBase ||
        input.replace(commonSuffix, "").replace(/\.vcf(\.gz)?$/, "");

      const regionFileOpt = regionsFile ? ["-R", regionsFile] : [];

      const eOpts = {
        assembly,
        samples: await getSamples(input, sampleMap),
        database: await loadHpoData(resDir),
        local,
        slivar: slivarCh
          ? ("compound-hets" as const)
          : slivar
          ? ("expr" as const)
          : undefined,
      };

      await Promise.all([annotate(input, "snp"), annotate(input, "indel")]);

      async function annotate(inputVcfGz: string, type: "snp" | "indel") {
        const suffix = `.${type}${finalVersion}.${assembly}`;

        const subVcfGz = `${outputBase}.full${suffix}.vcf.gz`;

        await bcftoolsView(inputVcfGz, subVcfGz, {
          args: ["-i", `TYPE="${type}"`, ...regionFileOpt],
        });

        const outCsvGz = `${outputBase}${suffix}.excel.csv.gz`,
          outTsvGz = `${outputBase}${suffix}.tsv.gz`;
        await extract(subVcfGz, outTsvGz, eOpts).then((input) =>
          tsv2excel(input, outCsvGz)
        );

        console.error(`Done, output to ${outCsvGz} and ${outTsvGz}`);
      }
    }
  );
