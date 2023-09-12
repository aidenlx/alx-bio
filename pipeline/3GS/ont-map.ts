import { Command, cd, ensureDir, join as j, resolve } from "@/deps.ts";
import { PositiveInt } from "@/utils/validate.ts";
import { Res, readGroupONT } from "@/pipeline/_res.ts";
import minimap2 from "@/pipeline/module/minimap2.ts";
import samtoolsIndex from "@/pipeline/module/samtools/index.ts";

export default new Command()
  .name("ont.map")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 4 })
  .option("--fq <path>", "fastq input in fq.gz format", { required: true })
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .action(async (opts) => {
    const reference = Res.hg38.refFa;

    const workPath = resolve(opts.outDir),
      sample = opts.sample,
      fastqInput = resolve(opts.fq),
      threads = opts.threads;

    await ensureDir(workPath);
    cd(workPath);

    const bamDir = "bamfile";

    const bamSorted = j(bamDir, `${sample}.sort.hg38.bam`);

    await ensureDir(bamDir);
    await minimap2(fastqInput, bamSorted, {
      threads,
      reference,
      readGroup: readGroupONT(sample),
      sort: true,
    });
    await samtoolsIndex(bamSorted, { threads });
  });
