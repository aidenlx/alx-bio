import {
  Command,
  yamlParse,
  yamlStringify,
  basename,
  dirname,
  join,
  resolve,
  EnumType,
  $,
} from "./deps.ts";
import merge from "https://esm.sh/lodash@4.17.21/merge";

const mode = new EnumType(["wes", "wgs"]);

const variantEffectFilter = {
  remove: [
    "FIVE_PRIME_UTR_EXON_VARIANT",
    "FIVE_PRIME_UTR_INTRON_VARIANT",
    "THREE_PRIME_UTR_EXON_VARIANT",
    "THREE_PRIME_UTR_INTRON_VARIANT",
    "NON_CODING_TRANSCRIPT_EXON_VARIANT",
    "NON_CODING_TRANSCRIPT_INTRON_VARIANT",
    "CODING_TRANSCRIPT_INTRON_VARIANT",
    "UPSTREAM_GENE_VARIANT",
    "DOWNSTREAM_GENE_VARIANT",
    "INTERGENIC_VARIANT",
    "REGULATORY_REGION_VARIANT",
  ],
};

const wesSteps = [
    { failedVariantFilter: {} },
    { variantEffectFilter },
    { frequencyFilter: { maxFrequency: 2.0 } },
    { pathogenicityFilter: { keepNonPathogenic: true } },
    { inheritanceFilter: {} },
    { omimPrioritiser: {} },
    { hiPhivePrioritiser: {} },
  ],
  wgsSteps = [
    { hiPhivePrioritiser: {} },
    /**
     * running the prioritiser followed by a priorityScoreFilter will remove genes
     * which are least likely to contribute to the phenotype defined in hpoIds, this will
     * dramatically reduce the time and memory required to analyse a genome.
     * 0.501 is a good compromise to select good phenotype matches and the best protein-protein interactions hits from hiPhive
     */
    {
      priorityScoreFilter: {
        priorityType: "HIPHIVE_PRIORITY",
        minPriorityScore: 0.501,
      },
    },
    { failedVariantFilter: {} },
    { regulatoryFeatureFilter: {} },
    { frequencyFilter: { maxFrequency: 2.0 } },
    { pathogenicityFilter: { keepNonPathogenic: true } },
    { inheritanceFilter: {} },
    { omimPrioritiser: {} },
  ];

export default new Command()
  .name("exomiser-cfg")
  .description("Generate exomiser config")
  .type("mode", mode)
  .option("-i, --input <input:string>", "input norm.vcf", { required: true })
  .option("-m, --mode <input:mode>", "preset mode", { required: true })
  .arguments("<HPOs...>")
  .action(async (options, ...hpoIds) => {
    const vcf = resolve(options.input);
    const outputDir = dirname(vcf);
    const outputDirectory = join(outputDir, "exomiser");
    const outputFileName = basename(vcf).split(".")[0];
    const genomeAssembly = vcf.includes("hg38") ? "hg38" : "hg19";
    const { stdout: _sampleIds } =
      await $`rg '#CHROM' ${options.input} | cut -f10-`;
    const sampleIds = _sampleIds
      .split("\t")
      .map((s) => s.trim())
      .filter(Boolean);
    if (sampleIds.length === 0) {
      throw new Error("No sample found");
    }
    const yaml = merge(
      {
        sample: {
          genomeAssembly,
          vcf,
          hpoIds,
          proband: sampleIds.at(0),
          pedigree: {
            persons: sampleIds.map((id) => ({
              individualId: id,
              affectedStatus: "AFFECTED",
            })),
          },
        },
      },
      await Deno.readTextFile(
        "/Users/aidenlx/repo/alx-bio/template/exomiser.yml"
      ).then(yamlParse),
      {
        analysis: {
          pathogenicitySources: [
            "CADD",
            "REVEL",
            "MVP",
            ...(options.mode === "wgs" ? ["REMM"] : []),
          ],
          steps: options.mode === "wgs" ? wgsSteps : wesSteps,
        },
        outputOptions: {
          outputDirectory,
          outputFileName,
          outputFormats: ["HTML", "JSON", "TSV_GENE", "TSV_VARIANT", "VCF"],
        },
      }
    );
    await Deno.writeTextFile(
      join(outputDir, "exomiser.yml"),
      yamlStringify(yaml)
    );
    console.log(resolve(join(outputDir, "exomiser.yml")));
  });
