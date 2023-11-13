import { Command, EnumType, resolve } from "@/deps.ts";
import Canvas, { isCanvasSampleType } from "@/pipeline/module/canvas.ts";

export default new Command()
  .name("canvas")
  .option("--bam <paths:string>", "bam inputs, format: /a.bam:father", {
    required: true,
  })
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .type("ASSEMBLY", new EnumType(["hg38"]))
  .option("-r, --ref <ver:ASSEMBLY>", "Ref", { required: true })
  .action(async (options) => {
    const inputs = [options.bam].map((query) => {
      const [bam, type] = query.split(":");
      if (!isCanvasSampleType(type)) {
        throw new Error(`invalid sample type: ${type}`);
      }
      return [resolve(bam), type] as const;
    });

    await Canvas(inputs, options.outDir, {
      assembly: options.ref,
    });
  });
