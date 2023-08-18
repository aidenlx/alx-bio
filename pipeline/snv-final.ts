import { $, Command, ensureDir, exists, path, resolve } from "@/deps.ts";
import { genomeAssembly } from "@/modules/common.ts";
import extract, { loadHpoData } from "./final/hpo-annot.ts";
import vcfanno from "@/pipeline/module/vcfanno.ts";
import { getFilterQuery } from "@/pipeline/module/filter.ts";
import SnpSiftFilter from "@/pipeline/module/snpsift/filter.ts";
import { getVcfannoCADDCfg } from "@/pipeline/_vcfanno.ts";
import { mVersion } from "@/pipeline/snv-annot-m.ts";
import tsv2excel from "./final/tsv2excel.ts";
import getSamples from "./final/get-samples.ts";
import { getExomiserFieldList } from "@/pipeline/final/fields.ts";
import bcftoolsView from "@/pipeline/module/bcftools/view.ts";
import filters from "./module/filter.json" assert { type: "json" };
import bcftoolsFilter from "@/pipeline/module/bcftools/filter.ts";
import genQC from "@/pipeline/module/gen-qc.ts";

// mamba create -y -c conda-forge -c bioconda -n snv-final snpeff snpsift bcftools xsv vcfanno ripgrep

export const finalVersion = "." + "v3_3";

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
      const _fullVcfGz = `${sample}._full${finalVersion}.${assembly}.vcf.gz`;
      if (caddScript) {
        const caddData = `${sample}.cadd.${assembly}.tsv.gz`;
        if (!exists(`${caddData}.tbi`)) {
          await $`tabix -b 2 -e 2 -s 1 ${caddData}`;
        }
        if (!exists(`${inputVcfGz}.tbi`)) {
          await $`tabix -p vcf ${inputVcfGz}`;
        }
        console.error(`Annotating ${inputVcfGz} with ${caddData}`);

        await vcfanno(inputVcfGz, _fullVcfGz, {
          threads: 4,
          config: [getVcfannoCADDCfg(resolve(caddData))],
        });
      } else {
        const checkCADD =
          await $`bcftools view -h ${inputVcfGz} | rg -wq "INFO=<ID=CADD_PHRED"`.nothrow();
        if (checkCADD.exitCode === 0) {
          console.info(`CADD script gen disabled, skipping CADD annotation...`);
          await $`ln -sf ${inputVcfGz} ${_fullVcfGz}`;
        } else {
          console.info(`no CADD annot found in ${inputVcfGz}, annot...`);
          await vcfanno(inputVcfGz, _fullVcfGz, {
            threads: 4,
            config: [getVcfannoCADDCfg(assembly)],
          });
        }
      }

      // apply hard filters and set FILTER column
      await bcftoolsFilter(_fullVcfGz, fullVcfGz, {
        include: filters.hardFilter,
      });
      await $`rm -f ${_fullVcfGz}`;

      /** extract options */
      const eOpts = {
        assembly,
        samples: await getSamples(fullVcfGz, sampleMap),
        database: await loadHpoData(resDir),
      };
      const regionFileOpt = regionsFile ? ["-R", regionsFile] : [];

      await Promise.all([
        annotate(fullVcfGz, "snp"),
        annotate(fullVcfGz, "indel"),
        exomiserExtra(
          fullVcfGz,
          `${sample}.full.exo-extra${finalVersion}.${assembly}.tsv.gz`,
          assembly
        ),
      ]);

      async function annotate(inputVcfGz: string, type: "snp" | "indel") {
        const suffix = `.${type}${finalVersion}.${assembly}`;

        const { join } = path;
        const fullDir = "full";
        const fullOut = {
          vcfGz: join(fullDir, `${sample}.full${suffix}.vcf.gz`),
          tsvGz: join(fullDir, `${sample}.full${suffix}.tsv.gz`),
          csvGz: join(fullDir, `${sample}.full${suffix}.excel.csv.gz`),
        };
        await ensureDir(fullDir);

        await bcftoolsView(inputVcfGz, fullOut.vcfGz, {
          args: ["-i", `TYPE="${type}"`, ...regionFileOpt],
        });

        const qcDir = "qc";
        const qcOut = {
          vcfGz: join(qcDir, `${sample}.full.qc${suffix}.vcf.gz`),
          tsvGz: join(qcDir, `${sample}.full.qc${suffix}.tsv.gz`),
          csvGz: join(qcDir, `${sample}.full.qc${suffix}.excel.csv.gz`),
        };

        const funcDir = "qc.impactful";
        const funcOut = {
          vcfGz: join(funcDir, `${sample}.full.filter${suffix}.vcf.gz`),
          tsvGz: join(funcDir, `${sample}.full.filter${suffix}.tsv.gz`),
          csvGz: join(funcDir, `${sample}.full.filter${suffix}.excel.csv.gz`),
        };

        await Promise.all([qcDir, funcDir].map(ensureDir));

        console.error(`Filtering & extracting from ${fullOut.vcfGz}...`);
        await Promise.all([
          genQC(fullOut.vcfGz, qcOut.vcfGz).then((input) =>
            Promise.all([
              SnpSiftFilter(input, getFilterQuery("effect"), funcOut.vcfGz)
                .then((input) => extract(input, funcOut.tsvGz, eOpts))
                .then((input) => tsv2excel(input, funcOut.csvGz))
                .then(() =>
                  console.error(
                    "Impactful variants hard-filtered and extracted"
                  )
                ),
              extract(input, qcOut.tsvGz, eOpts)
                .then((input) => tsv2excel(input, qcOut.csvGz))
                .then(() => console.error("Hard-filtered and extracted")),
            ])
          ),
          extract(fullOut.vcfGz, fullOut.tsvGz, eOpts)
            .then((input) => tsv2excel(input, fullOut.csvGz))
            .then(() => console.error(`Extracted full without filters`)),
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
