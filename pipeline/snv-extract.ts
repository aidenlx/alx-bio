import { Command } from "@/deps.ts";
import { genomeAssembly } from "@/modules/common.ts";
import extract, { loadHpoData } from "@/pipeline/final/hpo-annot.ts";
import getSamples from "@/pipeline/final/get-samples.ts";
import tsv2excel from "@/pipeline/final/tsv2excel.ts";

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
  .action(
    async ({
      input,
      resource: resDir,
      ref,
      outputBase,
      sampleMap,
      local,
      slivar,
      slivarCh,
    }) => {
      outputBase = outputBase || input.replace(/\.vcf(\.gz)?$/, "");
      const outCsvGz = `${outputBase}.${ref}.excel.csv.gz`,
        outTsvGz = `${outputBase}.${ref}.tsv.gz`;
      await extract(input, outTsvGz, {
        assembly: ref,
        samples: await getSamples(input, sampleMap),
        database: await loadHpoData(resDir),
        local,
        slivar: slivarCh ? "compound-hets" : slivar ? "expr" : undefined,
      }).then((input) => tsv2excel(input, outCsvGz));

      console.error(`Done, output to ${outCsvGz} and ${outTsvGz}`);
    }
  );
