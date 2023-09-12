import { Command, cd, resolve } from "@/deps.ts";
import { PositiveInt } from "@/utils/validate.ts";
import { genomeAssembly } from "@/modules/common.ts";
import AnnotSV from "@/pipeline/module/annotsv.ts";

export default new Command()
  .name("sv.annot")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 4 })
  .option("--vcf <path>", "vcf input", { required: true })
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .type("genomeAssembly", genomeAssembly)
  .option("-r, --ref <ref:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .action(async (options) => {
    const workPath = resolve(options.outDir),
      sample = options.sample,
      vcfInput = resolve(options.vcf);

    cd(workPath);

    const annotatedVcfBase = `${sample}.svision.anno`;
    await AnnotSV(vcfInput, annotatedVcfBase, {
      reference: options.ref,
    });
  });
