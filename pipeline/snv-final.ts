import { $, Command, exists, resolve } from "@/deps.ts";
import { genomeAssembly } from "@/modules/common.ts";
import ExtractAndHpoAnnot, { loadHpoData } from "./module/hpo-annot.ts";
import vcfanno from "@/pipeline/module/vcfanno.ts";
import { getFilterQuery } from "@/pipeline/module/filter.ts";
import SnpSiftFilter from "@/pipeline/module/snpsift/filter.ts";

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
  const output = outputVcfGz.replace(/\.gz$/, "");
  await vcfanno(inputVcfGz, output, {
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
  if (await exists(output)) {
    await $`bgzip -f ${output} && tabix -f -p vcf ${outputVcfGz}`;
  }
  console.error(`Done, output to ${outputVcfGz}`);
}

async function getSamples(inputVcfGz: string, sampleMap?: string) {
  const { stdout: _samples } = await $`bcftools query -l ${inputVcfGz}`;
  let samples = _samples.trim().split("\n");
  if (sampleMap) {
    const map = (await Deno.readTextFile(sampleMap)).split("\n");
    samples = samples.map((_, i) => map[i]);
  }
  return samples;
}

export default new Command()
  .name("snv.final")
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
      const inputVcfGz = `${sample}.m.${assembly}.vcf.gz`;
      const fullVcfGz = `${sample}.full.${assembly}.vcf.gz`;
      const caddData = `${sample}.cadd.${assembly}.tsv.gz`;
      if (caddScript) {
        await caddAnnot(caddData, inputVcfGz, fullVcfGz);
      } else {
        console.info(`CADD script gen disabled, skipping CADD annotation...`);
        await Deno.symlink(inputVcfGz, fullVcfGz, { type: "file" });
      }
      const samples = await getSamples(fullVcfGz, sampleMap);
      const hpoData = await loadHpoData(resDir);

      await Promise.all([withFilter(), noFilter(), exomiserExtra()]);

      async function withFilter() {
        const qcVcfGz = `${sample}.full.qc.${assembly}.vcf.gz`,
          qcTsvGz = `${sample}.full.qc.v3.${assembly}.tsv.gz`,
          qcCsvGz = `${sample}.full.qc.v3.${assembly}.excel.csv.gz`;
        console.error(`Filtering on qc...`);
        await SnpSiftFilter(fullVcfGz, getFilterQuery("qual"), qcVcfGz);

        await Promise.all([
          fc(qcVcfGz),
          extract(qcVcfGz, qcTsvGz).then(() => tsv2excel(qcTsvGz, qcCsvGz)),
        ]);

        async function fc(inputVcfGz: string) {
          const fcVcfGz = `${sample}.full.filter.${assembly}.vcf.gz`,
            fcTsvGz = `${sample}.full.filter.v3.${assembly}.tsv.gz`,
            fcCsvGz = `${sample}.full.filter.v3.${assembly}.excel.csv.gz`;
          console.error(`Filtering on effect...`);
          await SnpSiftFilter(inputVcfGz, getFilterQuery("effect"), fcVcfGz);
          await extract(fcVcfGz, fcTsvGz);
          await tsv2excel(fcTsvGz, fcCsvGz);
        }
      }

      async function noFilter() {
        console.error(`No filter, extracting full...`);
        const fullTsvGz = `${sample}.full.v3.${assembly}.tsv.gz`,
          fullCsvGz = `${sample}.full.v3.${assembly}.excel.csv.gz`;
        await extract(fullVcfGz, fullTsvGz);
        await tsv2excel(fullTsvGz, fullCsvGz);
      }

      /** output extra data for exomiser */
      async function exomiserExtra() {
        const exoExtraTsvGz = `${sample}.full.exo-extra.${assembly}.tsv.gz`;
        const extraFields =
          assembly === "hg19" ? exomiserExtraFields : exomiserExtraFieldsHg38;
        await $`SnpSift extractFields -s "," -e "." ${fullVcfGz} ${extraFields} \
| sed '1s/CHROM/#CHROM/' \
| bgzip > ${exoExtraTsvGz} \
&& tabix -f -s 1 -b 2 -e 2 ${exoExtraTsvGz}`;
      }

      async function extract(inputVcfGz: string, outputTsvGz: string) {
        console.error(`Extracting from ${inputVcfGz}...`);

        await ExtractAndHpoAnnot(inputVcfGz, outputTsvGz, {
          assembly,
          samples,
          database: hpoData,
        });
        console.error(`Done, output to ${outputTsvGz}`);
      }
      async function tsv2excel(inputTsvGz: string, outputCsvGz: string) {
        console.error(`Converting ${inputTsvGz} to excel csv format...`);
        // write BOM header (printf "\xEF\xBB\xBF")
        const outputCsv = outputCsvGz.slice(0, -3);
        await $`printf "\\xEF\\xBB\\xBF" > ${outputCsv} && \
zcat ${inputTsvGz} | xsv fmt -d '\\t' --crlf >> ${outputCsv} \
&& bgzip -f ${outputCsv}`;
        console.error(`Done, output to ${outputCsvGz}`);
      }
    }
  );

const exomiserExtraFields = `
CHROM
POS
REF
ALT
QUAL
DP
FS
MQ
QD
gnomad_e211_AF
gnomad_e211_AF_eas
gnomad_g211_AF
gnomad_g211_AF_eas
WBBC_AF
WBBC_South_AF
ANN
GEN[*].GT
CADD_PHRED
`
  .trim()
  .split("\n");

const exomiserExtraFieldsHg38 = exomiserExtraFields.map((f) =>
  f.replace(/gnomad_g211/g, "gnomad312")
);
