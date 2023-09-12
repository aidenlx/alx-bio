import { Command, cd, resolve } from "@/deps.ts";
import { PositiveInt } from "@/utils/validate.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import SVision, { defaultModel } from "@/pipeline/module/svision.ts";

export default new Command()
  .name("sv.call")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 4 })
  .option("--bam <path>", "bam input", { required: true })
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <ref:genomeAssembly>", "reference genome", {
    required: true,
  })
  .env("SV_MODEL <model_path>", `Model for SVision, default to ${defaultModel}`)
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .action(async (options) => {
    const workPath = resolve(options.outDir),
      sample = options.sample,
      bamInput = resolve(options.bam),
      threads = options.threads;

    cd(workPath);

    const svDir = "svision";

    await SVision(bamInput, svDir, {
      reference: options.ref,
      sample,
      model: options.svModel ?? defaultModel,
      threads,
    });
  });
