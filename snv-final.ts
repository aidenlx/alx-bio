import { $, Command, exists, tomlStringify, resolve } from "./deps.ts";
import { genomeAssembly } from "./modules/common.ts";
import ExtractAndHpoAnnot from "./modules/hpo-annot.ts";

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
  const config = {
    annotation: [
      {
        file: resolve(cadd),
        columns: [6],
        names: ["CADD_PHRED"],
        ops: ["mean"],
      },
    ],
  };
  const cfgFile = await Deno.makeTempFile({ suffix: ".toml" });
  try {
    await Deno.writeTextFile(cfgFile, tomlStringify(config));
    console.error(`Annotating ${inputVcfGz} with ${cadd}`);
    await $`[ ! -f ${cadd}.tbi ] && tabix -b 2 -e 2 -s 1 ${cadd} || true`;
    await $`vcfanno ${cfgFile} ${inputVcfGz} | bgzip > ${outputVcfGz} && tabix -p vcf ${outputVcfGz}`;
  } catch (err) {
    throw err;
  } finally {
    await Deno.remove(cfgFile);
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
  .option("-s, --sample <name:string>", "Sample name", { required: true })
  .option("--sample-map <file:string>", "Sample name mapping file")
  .action(async ({ ref: assembly, sample, sampleMap, resource: resDir }) => {
    const inputVcfGz = `${sample}.m.${assembly}.vcf.gz`;
    const fullVcfGz = `${sample}.full.${assembly}.vcf.gz`;
    const caddData = `${sample}.cadd.${assembly}.tsv.gz`;
    await caddAnnot(caddData, inputVcfGz, fullVcfGz);
    const samples = await getSamples(fullVcfGz, sampleMap);

    async function extract(inputVcfGz: string, outputTsvGz: string) {
      console.error(`Extracting from ${inputVcfGz}...`);

      await ExtractAndHpoAnnot(inputVcfGz, outputTsvGz, {
        assembly,
        samples,
        resDir,
      });
      console.error(`Done, output to ${outputTsvGz}`);
    }
    async function tsv2excel(inputTsvGz: string, outputCsvGz: string) {
      console.error(`Converting ${inputTsvGz} to excel csv format...`);
      // write BOM header (printf "\xEF\xBB\xBF")
      const outputCsv = outputCsvGz.slice(0, -3);
      await Deno.writeTextFile(outputCsv, "\xEF\xBB\xBF");
      await $`zcat ${inputTsvGz} | xsv fmt -d '\\t' --crlf >> ${outputCsv} && bgzip -f ${outputCsv}`;
      console.error(`Done, output to ${outputCsvGz}`);
    }

    await Promise.all([
      (async function withFilter() {
        const qcVcfGz = `${sample}.full.qc.${assembly}.vcf.gz`,
          qcTsvGz = `${sample}.full.qc.v2.${assembly}.tsv.gz`,
          qcCsvGz = `${sample}.full.qc.v2.${assembly}.excel.csv.gz`;
        console.error(`Filtering on qc...`);
        await $`zcat ${fullVcfGz} \
| SnpSift filter "($(pipeline vcf.filter-q -o qual))" \
| bgzip > ${qcVcfGz}`;
        await extract(qcVcfGz, qcTsvGz);
        await tsv2excel(qcTsvGz, qcCsvGz);

        const fcVcfGz = `${sample}.full.filter.${assembly}.vcf.gz`,
          fcTsvGz = `${sample}.full.filter.v2.${assembly}.tsv.gz`,
          fcCsvGz = `${sample}.full.filter.v2.${assembly}.excel.csv.gz`;
        console.error(`Filtering on effect...`);
        await $`zcat ${qcVcfGz} \
| SnpSift filter "($(pipeline vcf.filter-q -o effect))" \
| bgzip > ${fcVcfGz}`;
        await extract(fcVcfGz, fcTsvGz);
        await tsv2excel(fcTsvGz, fcCsvGz);
      })(),
      (async function noFilter() {
        const fullTsvGz = `${sample}.full.filter.v2.${assembly}.tsv.gz`,
          fullCsvGz = `${sample}.full.filter.v2.${assembly}.excel.csv.gz`;
        await extract(fullVcfGz, fullTsvGz);
        await tsv2excel(fullTsvGz, fullCsvGz);
      })(),
    ]);
  });
