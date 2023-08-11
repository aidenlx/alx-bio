import { $, Command, exists, resolve } from "@/deps.ts";
import { genomeAssembly } from "@/modules/common.ts";
import extract, { loadHpoData } from "./final/hpo-annot.ts";
import vcfanno from "@/pipeline/module/vcfanno.ts";
import { getFilterQuery } from "@/pipeline/module/filter.ts";
import SnpSiftFilter from "@/pipeline/module/snpsift/filter.ts";
import { getVcfannoCADDCfg } from "@/pipeline/_res.ts";
import { mVersion } from "@/pipeline/snv-annot-m.ts";
import tsv2excel from "./final/tsv2excel.ts";
import getSamples from "./final/get-samples.ts";
import { getExomiserFieldList } from "@/pipeline/final/fields.ts";
import bcftoolsView from "@/pipeline/module/bcftools/view.ts";

// mamba create -y -c conda-forge -c bioconda -n snv-final snpeff snpsift bcftools xsv vcfanno ripgrep

export const finalVersion = "." + "v3_1";

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
  .option("--regions-file <FILE:string>", "restrict to regions listed in FILE")
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
      regionsFile,
    }) => {
      const inputVcfGz = `${sample}.m${mVersion}.${assembly}.vcf.gz`;
      const fullVcfGz = `${sample}.full${finalVersion}.${assembly}.vcf.gz`;
      if (caddScript) {
        const caddData = `${sample}.cadd.${assembly}.tsv.gz`;
        if (!exists(`${caddData}.tbi`)) {
          await $`tabix -b 2 -e 2 -s 1 ${caddData}`;
        }
        if (!exists(`${inputVcfGz}.tbi`)) {
          await $`tabix -p vcf ${inputVcfGz}`;
        }
        console.error(`Annotating ${inputVcfGz} with ${caddData}`);

        await vcfanno(inputVcfGz, fullVcfGz, {
          threads: 4,
          config: [getVcfannoCADDCfg(resolve(caddData))],
        });
      } else {
        const hasCADDAnnotation =
          (await $`bcftools view -h ${inputVcfGz} | rg -wq "INFO=<ID=CADD_PHRED"`)
            .exitCode === 0;
        if (hasCADDAnnotation) {
          console.info(`CADD script gen disabled, skipping CADD annotation...`);
          await $`ln -sf ${inputVcfGz} ${fullVcfGz}`;
        } else {
          console.info(`no CADD annot found in ${inputVcfGz}, annot...`);
          await vcfanno(inputVcfGz, fullVcfGz, {
            threads: 4,
            config: [getVcfannoCADDCfg(assembly)],
          });
        }
      }

      /** extract options */
      const eOpts = {
        assembly,
        samples: await getSamples(fullVcfGz, sampleMap),
        database: await loadHpoData(resDir),
      };
      const regionFileOpt = regionsFile ? ["-R", regionsFile] : [];

      await Promise.all([
        annotate(inputVcfGz, "snp"),
        annotate(inputVcfGz, "indel"),
      ]);

      async function annotate(inputVcfGz: string, type: "snp" | "indel") {
        const suffix = `.${type}${finalVersion}.${assembly}`;

        const subVcfGz = `${sample}.full${suffix}.vcf.gz`;

        await bcftoolsView(inputVcfGz, subVcfGz, {
          args: ["-i", `TYPE="${type}"`, ...regionFileOpt],
        });

        const qcVcfGz = `${sample}.full.qc${suffix}.vcf.gz`,
          qcTsvGz = `${sample}.full.qc${suffix}.tsv.gz`,
          qcCsvGz = `${sample}.full.qc${suffix}.excel.csv.gz`;
        const funcVcfGz = `${sample}.full.filter${suffix}.vcf.gz`,
          funcTsvGz = `${sample}.full.filter${suffix}.tsv.gz`,
          funcCsvGz = `${sample}.full.filter${suffix}.excel.csv.gz`;
        const fullTsvGz = `${sample}.full${suffix}.tsv.gz`,
          fullCsvGz = `${sample}.full${suffix}.excel.csv.gz`;
        const exoExtraTsvGz = `${sample}.full.exo-extra${suffix}.tsv.gz`;

        console.error(`Filtering & extracting from ${inputVcfGz}...`);
        await Promise.all([
          SnpSiftFilter(inputVcfGz, getFilterQuery("qual"), qcVcfGz).then(
            (input) =>
              Promise.all([
                SnpSiftFilter(input, getFilterQuery("effect"), funcVcfGz)
                  .then((input) => extract(input, funcTsvGz, eOpts))
                  .then((input) => tsv2excel(input, funcCsvGz))
                  .then(() =>
                    console.error(
                      "Impactful variants hard-filtered and extracted"
                    )
                  ),
                extract(qcVcfGz, qcTsvGz, eOpts)
                  .then((input) => tsv2excel(input, qcCsvGz))
                  .then(() => console.error("Hard-filtered and extracted")),
              ])
          ),
          extract(inputVcfGz, fullTsvGz, eOpts)
            .then((input) => tsv2excel(input, fullCsvGz))
            .then(() => console.error(`Extracted full without filters`)),
          exomiserExtra(inputVcfGz, exoExtraTsvGz, assembly),
        ]);
      }
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
