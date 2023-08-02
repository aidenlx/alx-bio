import { Command, D, EnumType, path, cd } from "@/deps.ts";
import { snpeff_assembly } from "./_res.ts";
import { orGzip } from "@/utils/or-gzip.ts";
import snpEff from "./module/snpeff.ts";
import { toFinalOutput, pipe } from "@/pipeline/pipe.ts";

export const sVersoin = "." + "";

export default new Command()
  .name("snv.annot.s")
  .version(sVersoin.substring(1))
  .description("Single thread vcf annotation pipeline")
  .type("genomeAssembly", new EnumType(D.keys(snpeff_assembly)))
  .option("-r, --ref <name:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("--no-stats", "Disable stats in snpEff")
  .option(
    "-i, --input <vcf>",
    "Input vcf, should be handled by bcftools norm -m -both",
    { required: true }
  )
  .option(
    "-o, --output-dir <DIR>",
    "Output directory, default to the same as input vcf"
  )
  .option(
    "--normed",
    "skip normalization warning, assume input vcf is already normalized"
  )
  .option("-s, --sample <name>", "Sample Name", { required: true })
  .action(async (options) => {
    const inputVcf = path.resolve(orGzip(options.input));
    const workPath = options.outputDir
      ? path.resolve(options.outputDir)
      : path.dirname(path.resolve(options.input));

    cd(workPath);

    console.info("Input vcf: " + inputVcf);

    if (!path.basename(inputVcf).includes("norm") && !options.normed) {
      throw new Error("Input vcf may not be handled by bcftools norm -m -both");
    }

    const ref = options.ref as keyof typeof snpeff_assembly;

    const prefix = options.sample + ".";

    const output = await toFinalOutput(
      pipe(inputVcf, async (input) => {
        console.info(`annotate ${input} with snpEff`);
        const output = prefix + `snpeff.${ref}.vcf.gz`;
        await snpEff(input, output, {
          memory: "20G",
          assembly: snpeff_assembly[ref],
          args: options.stats ? ["-noStats"] : [],
        });
        return output;
      }),
      prefix + `s${sVersoin}.${ref}.vcf`
    );

    console.info(`single thread Annotation finished. Output: ${output}`);
  });
