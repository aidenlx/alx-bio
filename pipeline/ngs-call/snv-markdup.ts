import { cd, Command, path } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { getMarkDupBam, getRawBam } from "@/pipeline/_res.ts";
import { validateOptions } from "@/pipeline/ngs-call/_common.ts";
import samtoolsIndex from "@/pipeline/module/samtools/index.ts";
import GATKMarkDuplicatesSpark from "@/pipeline/module/gatk/markDupSpark.ts";
import { PositiveInt } from "@/utils/validate.ts";

export default new Command()
  .name("snv.markdup")
  .description("GATK Markdup")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 4 })
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("--no-cleanup", "skip cleanup, keep intermedia files")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <assembly:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  // .option("--spark", "Spark")
  .action(async (options) => {
    const { sample, workPath, assembly, cleanup } = await validateOptions(
      options,
    );

    const { threads } = options;
    cd(workPath);

    const bam_dir = "bamfile";

    console.info("TASK: MarkDuplicates");
    const bam_raw = path.join(bam_dir, getRawBam(sample, assembly));
    const bam_markdup = path.join(bam_dir, getMarkDupBam(sample, assembly));
    // skip metrics collection as it slows down spark version and is optional
    await GATKMarkDuplicatesSpark(bam_raw, { bam: bam_markdup }, { threads });
    // if (options.spark) {
    // } else {
    //   await GATKMarkDuplicates(
    //     bam_sort,
    //     { bam: bam_markdup, metrics },
    //     { threads }
    //   );
    // }
    // await cleanup(bam_sort);

    await samtoolsIndex(bam_markdup, { threads });
    cleanup(bam_raw);

    console.info("END ALL ************************************* Bey");
  });
