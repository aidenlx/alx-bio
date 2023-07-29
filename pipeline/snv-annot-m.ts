import { Command, D, EnumType, path, cd } from "@/deps.ts";
import { snpeff_assembly, vcfannoCADD, vcfannoCfg } from "./_res.ts";
import { orGzip } from "@/utils/or-gzip.ts";
import vcfanno from "./module/vcfanno.ts";
import tableAnnovar from "./module/annovar/table_annovar.ts";
import { toFinalOutput, pipe } from "./pipe.ts";

export default new Command()
  .name("snv.annot.m")
  .option("-t, --threads <count:integer>", "Threads", { default: 4 })
  .type("genomeAssembly", new EnumType(D.keys(snpeff_assembly)))
  .option("-r, --ref <name:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("--no-cadd", "Skip using prescored CADD annotation")
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
    const threads = options.threads;
    if (threads <= 0) {
      throw new Error("threads must be a positive integer");
    }

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
          console.info(`annotate ${input} with annovar`);
          const annovarOutBase = prefix + "annovar";
          const {
            vcf: vcfAnnovar,
            avinput,
            tsv: tsvAnnovar,
          } = await tableAnnovar(input, annovarOutBase, {
            threads,
            assembly: ref,
          });
          return [avinput, tsvAnnovar, vcfAnnovar];
        },
        async (input) => {
          console.info(`annotate ${input} with vcfanno`);
          const output = prefix + `vcfannot.${ref}.vcf.gz`;
          await vcfanno(orGzip(input), output, {
            threads,
            config: [...vcfannoCfg[ref], options.cadd && vcfannoCADD[ref]],
          });
          return output;
        }
      ),
      prefix + `m.${ref}.vcf`
    );

    console.info(`multithread Annotation finished. Output: ${output}.gz`);
  });
