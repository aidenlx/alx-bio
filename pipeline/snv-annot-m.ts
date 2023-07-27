import { Command, D, EnumType, path, cd, $, exists } from "@/deps.ts";
import { snpeff_assembly, vcfannoCfg } from "./_res.ts";
import { orGzip } from "@/utils/or-gzip.ts";
import vcfanno from "./module/vcfanno.ts";
import tableAnnovar from "./module/annovar/table_annovar.ts";

export default new Command()
  .name("snv.annot.m")
  .option("-t, --threads <count:integer>", "Threads", { default: 4 })
  .type("genomeAssembly", new EnumType(D.keys(snpeff_assembly)))
  .option("-r, --ref <name:genomeAssembly>", "reference genome", {
    required: true,
  })
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

    const inputVcf = path.resolve(await orGzip(options.input));
    const workPath = options.outputDir
      ? path.resolve(options.outputDir)
      : path.dirname(path.resolve(options.input));

    cd(workPath);

    if (!path.basename(inputVcf).includes("norm") && !options.normed) {
      throw new Error("Input vcf may not be handled by bcftools norm -m -both");
    }

    const ref = options.ref as keyof typeof snpeff_assembly;

    const prefix = options.sample + ".";

    const intermediate = await pipe(
      inputVcf,
      async (input) => {
        console.info(`annotate ${input} with annovar`);
        if (input.endsWith(".gz")) {
          await $`gunzip ${input}`;
          input = input.slice(0, -3);
        }
        const annovarOutBase = prefix + "annovar";
        const {
          vcf: vcfAnnovar,
          avinput,
          tsv: tsvAnnovar,
        } = await tableAnnovar(input, annovarOutBase, {
          threads,
          assembly: ref,
        });
        await $`bgzip ${input}`;
        return [avinput, tsvAnnovar, vcfAnnovar];
      },
      async (input) => {
        console.info(`annotate ${input} with vcfanno`);
        const output = prefix + `vcfannot.${ref}.vcf`;
        await vcfanno(input, output, { threads, config: vcfannoCfg[ref] });
        return output;
      }
    );

    const output = prefix + `m.${ref}.vcf`;
    // if all intermediate files exist    const intermediate = [vcfSnpeff, vcfDbnsfp, vcfClinvar];
    if (
      (await Promise.all(intermediate.map((f) => exists(f)))).every(Boolean)
    ) {
      await $`cp ${intermediate.at(-1)} ${output}`;
      await $`for f in ${[...intermediate, output]}; do bgzip $f; done;`;
    }
    if (!(await exists(`${output}.gz`))) {
      await $`bgzip ${output} && tabix -f -p vcf ${output}.gz`;
    }

    console.info(`multithread Annotation finished. Output: ${output}.gz`);
  });

async function pipe(
  input: string,
  ...steps: ((input: string) => Promise<string | string[]>)[]
) {
  const outputs: string[] = [];
  for (const step of steps) {
    let output = await step(input);
    if (typeof output === "string") output = [output];
    if (output.length === 0) throw new Error("no output for " + input);
    outputs.push(...output);
    input = output.pop()!;
  }
  if (outputs.length === 0) throw new Error("no steps");
  return outputs;
}
