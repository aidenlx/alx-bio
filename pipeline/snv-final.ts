import { $, Command, exists, resolve } from "@/deps.ts";
import { genomeAssembly } from "@/modules/common.ts";
import extract, { loadHpoData } from "./final/hpo-annot.ts";
import vcfanno from "@/pipeline/module/vcfanno.ts";
import { getFilterQuery } from "@/pipeline/module/filter.ts";
import SnpSiftFilter from "@/pipeline/module/snpsift/filter.ts";
import { vcfannoCADD } from "@/pipeline/_res.ts";
import { mVersion } from "@/pipeline/snv-annot-m.ts";
import tsv2excel from "./final/tsv2excel.ts";
import getSamples from "./final/get-samples.ts";
import { getExomiserFieldList } from "@/pipeline/final/fields.ts";

// mamba create -y -c conda-forge -c bioconda -n snv-final snpeff snpsift bcftools xsv vcfanno

const finalVersion = "." + "v3_1";

async function caddAnnot(
  cadd: string,
  inputVcfGz: string,
  outputVcfGz: string
) {
  if (!exists(`${cadd}.tbi`)) {
    console.error("Indexing CADD database...");
    await $`tabix -b 2 -e 2 -s 1 ${cadd}`;
  }
  if (!exists(`${inputVcfGz}.tbi`)) {
    console.error("Indexing input VCF file...");
    await $`tabix -p vcf ${inputVcfGz}`;
  }

  console.error(`Annotating ${inputVcfGz} with ${cadd}`);

  await vcfanno(inputVcfGz, outputVcfGz, {
    config: [
      {
        file: resolve(cadd),
        columns: [6],
        names: ["CADD_PHRED"],
        ops: ["mean"],
      },
    ],
    threads: 4,
  });
  console.error(`Done, output to ${outputVcfGz}`);
}

export default new Command()
  .name("snv.final")
  .version(finalVersion.substring(1))
  .description(
    "Annotate HPO phenotypes and disease, filter with preset rules and output tab-delimited table and Excel ready table"
  )
  .type("genomeAssembly", genomeAssembly)
  .option("-r, --ref <genome:genomeAssembly>", "Genome assembly", {
    required: true,
  })
  .option("--resource <dir:string>", "Path to Resource", {
    default: "/genetics/home/stu_liujiyuan/alx-bio/deno-csv/res/",
  })
  .option(
    "--no-cadd-script",
    "use prescored CADD score in favor of CADD script"
  )
  .option("-s, --sample <name:string>", "Sample name", { required: true })
  .option("--sample-map <file:string>", "Sample name mapping file")
  .action(
    async ({
      ref: assembly,
      sample,
      sampleMap,
      resource: resDir,
      caddScript,
    }) => {
      const inputVcfGz = `${sample}.m${mVersion}.${assembly}.vcf.gz`;
      const fullVcfGz = `${sample}.full${finalVersion}.${assembly}.vcf.gz`;
      const caddData = `${sample}.cadd.${assembly}.tsv.gz`;
      if (caddScript) {
        await caddAnnot(caddData, inputVcfGz, fullVcfGz);
      } else {
        const result =
          await $`bcftools view -h ${inputVcfGz} | rg -wq "INFO=<ID=CADD_PHRED"`;
        if (result.exitCode === 0) {
          console.info(`CADD script gen disabled, skipping CADD annotation...`);
          await $`ln -sf ${inputVcfGz} ${fullVcfGz}`;
        } else {
          console.info(`no CADD annot found in ${inputVcfGz}, annot...`);
          await vcfanno(inputVcfGz, fullVcfGz, {
            threads: 4,
            config: [vcfannoCADD[assembly]],
          });
        }
      }
      const eOpts = {
        assembly,
        samples: await getSamples(fullVcfGz, sampleMap),
        database: await loadHpoData(resDir),
      };
      const qcVcfGz = `${sample}.full.qc${finalVersion}.${assembly}.vcf.gz`,
        qcTsvGz = `${sample}.full.qc${finalVersion}.${assembly}.tsv.gz`,
        qcCsvGz = `${sample}.full.qc${finalVersion}.${assembly}.excel.csv.gz`;
      const funcVcfGz = `${sample}.full.filter${finalVersion}.${assembly}.vcf.gz`,
        funcTsvGz = `${sample}.full.filter${finalVersion}.${assembly}.tsv.gz`,
        funcCsvGz = `${sample}.full.filter${finalVersion}.${assembly}.excel.csv.gz`;
      const fullTsvGz = `${sample}.full${finalVersion}.${assembly}.tsv.gz`,
        fullCsvGz = `${sample}.full${finalVersion}.${assembly}.excel.csv.gz`;
      const exoExtraTsvGz = `${sample}.full.exo-extra${finalVersion}.${assembly}.tsv.gz`;

      console.error("Filtering...");
      await Promise.all([
        SnpSiftFilter(fullVcfGz, getFilterQuery("qual"), qcVcfGz).then(
          (input) =>
            Promise.all([
              SnpSiftFilter(input, getFilterQuery("effect"), funcVcfGz)
                .then((input) => extract(input, funcTsvGz, eOpts))
                .then((input) => tsv2excel(input, funcCsvGz))
                .then(() => console.error("Filtered on effects")),
              extract(qcVcfGz, qcTsvGz, eOpts)
                .then((input) => tsv2excel(input, qcCsvGz))
                .then(() => console.error("Filtered on qc")),
            ])
        ),
        extract(fullVcfGz, fullTsvGz, eOpts)
          .then((input) => tsv2excel(input, fullCsvGz))
          .then(() => console.error(`No filter, extracted full...`)),
        exomiserExtra(fullCsvGz, exoExtraTsvGz, assembly),
      ]);
    }
  );

/** output extra data for exomiser */
async function exomiserExtra(
  input: string,
  output: string,
  assembly: "hg19" | "hg38"
) {
  const extraFields = getExomiserFieldList(assembly, { local: true });
  await $`SnpSift extractFields -s "," -e "." ${input} ${extraFields} \
  | sed '1s/CHROM/#CHROM/' \
  | bgzip > ${output} \
  && tabix -f -s 1 -b 2 -e 2 ${output}`;
}
