import { cd, Command, D, EnumType, path, tomlStringify } from "@/deps.ts";
import { Res, slivarGnotateDb, snpeff_assembly } from "./_res.ts";
import { getVcfannoCADDCfg, vcfannoCfg, vcfannoLocal } from "./_vcfanno.ts";
import { orGzip } from "@/utils/or-gzip.ts";
import vcfanno from "./module/vcfanno.ts";
import slivarGnotate from "./module/slivar-gnotate.ts";
import { pipe, toFinalOutput } from "./pipe.ts";
import { PositiveInt } from "@/utils/validate.ts";
import { popmaxPostAnnot } from "@/pipeline/_freq.ts";

export const mVersion = "." + "v3_0";

export default new Command()
  .name("snv.annot.m")
  .version(mVersion.substring(1))
  .description("Multi-thread vcf annotation pipeline")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 4 })
  .type("genomeAssembly", new EnumType(D.keys(snpeff_assembly)))
  .option("-r, --ref <name:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("--no-cadd", "Skip using prescored CADD annotation")
  .option("--no-local", "Skip local database annotation")
  .option(
    "-i, --input <vcf>",
    "Input vcf, should be handled by bcftools norm -m -both",
    { required: true },
  )
  .option(
    "-o, --output-dir <DIR>",
    "Output directory, default to the same as input vcf",
  )
  .option(
    "--normed",
    "skip normalization warning, assume input vcf is already normalized",
  )
  .option("-s, --sample <name>", "Sample Name", { required: true })
  .action(async (options) => {
    console.error(`snv.annot.m${mVersion}`);
    console.error(`Options:\n` + tomlStringify(options));

    const { threads } = options;
    const inputVcf = path.resolve(orGzip(options.input));
    const workPath = options.outputDir
      ? path.resolve(options.outputDir)
      : path.dirname(path.resolve(options.input));

    cd(workPath);

    if (!path.basename(inputVcf).includes("norm") && !options.normed) {
      throw new Error("Input vcf may not be handled by bcftools norm -m -both");
    }

    const ref = options.ref as keyof typeof snpeff_assembly;

    const prefix = options.sample + ".";

    const output = await toFinalOutput(
      pipe(
        inputVcf,
        async (input) => {
          console.info(`annotate ${input} with slivar gnotate`);
          const output = prefix + `slivar${mVersion}.${ref}.vcf.gz`;

          await slivarGnotate(input, output, {
            threads,
            databases: [...slivarGnotateDb.gnomad[ref]],
            ref: ref === "hg19" ? Res.hs37.refFa : Res.hg38.refFa,
          });
          return output;
        },
        async (input) => {
          console.info(`annotate ${input} with vcfanno`);
          const output = prefix + `vcfanno${mVersion}.${ref}.vcf.gz`;
          await vcfanno(orGzip(input), output, {
            threads,
            config: {
              annotation: [
                ...vcfannoCfg[ref],
                options.local && vcfannoLocal[ref],
                options.cadd && (await getVcfannoCADDCfg(ref, true)),
              ],
              postannotation: popmaxPostAnnot(ref),
            },
          });
          return output;
        },
      ),
      prefix + `m${mVersion}.${ref}.vcf`,
    );

    console.info(`multithread Annotation finished. Output: ${output}.gz`);
  });
