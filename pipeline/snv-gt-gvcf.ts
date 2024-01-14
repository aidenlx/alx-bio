import { Command } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { Res } from "@/pipeline/_res.ts";
import GATKGenotypeGVCFs from "@/pipeline/module/gatk/genotypeGVCFs.ts";

export const mergeVersion = "." + "v2";

export default new Command()
  .name("snv.gt-gvcf")
  .description("")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-L, --intervals <path>", "intervals")
  .option("-r, --ref <name:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-i, --input <name>", "Output file name", { required: true })
  .option("-o, --output <name>", "Output file name", { required: true })
  .action(async (options) => {
    const assembly = options.ref;
    const reference = Res[assembly].refFa;

    const gVcfGz = options.input,
      rawVcfGz = options.output;

    console.error(
      `GenotypeGVCFs, inputs: ${gVcfGz}, interval: ${options.intervals}, output: ${rawVcfGz}`,
    );
    await GATKGenotypeGVCFs(gVcfGz, rawVcfGz, {
      reference,
      intervals: options.intervals,
    });
  });
