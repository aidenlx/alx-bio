import { cd, Command, path } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { getMarkDupBam } from "@/pipeline/_res.ts";
import { validateOptions } from "@/pipeline/ngs-call/_common.ts";
import { PositiveInt } from "@/utils/validate.ts";
import samtoolsSort from "@/pipeline/module/samtools/sort.ts";

export default new Command()
  .name("snv.bam-sort")
  .description("Initial short-read sequence alignment pipeline")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 12 })
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("--no-cleanup", "skip cleanup, keep intermedia files")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <assembly:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .action(async (options) => {
    const { sample, workPath, assembly, cleanup } =
      await validateOptions(options);

    const threads = options.threads;
    cd(workPath);

    const bam_dir = "bamfile";

    const bam_markdup = path.join(bam_dir, getMarkDupBam(sample, assembly));

    // do sort after markdup, as markdupspark is optimized for queryname sorted bam

    console.info("TASK: BAM SORT");
    const bam_sort = path.join(bam_dir, `${sample}.sort.${assembly}.bam`);
    await samtoolsSort(bam_markdup, bam_sort, { threads, memory: "1706M" });
    await cleanup(bam_markdup);

    console.info("END ALL ************************************* Bey");
  });
