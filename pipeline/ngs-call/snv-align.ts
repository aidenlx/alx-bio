import { assert, cd, Command, ensureDir, path } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { getRawBam, parseFastqOption, readGroup } from "@/pipeline/_res.ts";
import { createLocalFastq } from "@/utils/ln-fastq.ts";
import { validateOptions } from "@/pipeline/ngs-call/_common.ts";
import fastp from "@/pipeline/module/fastp.ts";
import bwaMem2 from "@/pipeline/module/bwa-mem2.ts";
// import samtoolsSort from "@/pipeline/module/samtools/sort.ts";
import { PositiveInt } from "@/utils/validate.ts";

export default new Command()
  .name("snv.align")
  .description("Initial short-read sequence alignment pipeline")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 4 })
  .option("--fq1 <path>", "forward fastq input in fq.gz format")
  .option("--fq2 <path>", "reverse fastq input in fq.gz format")
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
    const { sample, workPath, assembly, cleanup, reference } =
      await validateOptions(options);

    const threads = options.threads;
    cd(workPath);

    const bam_dir = "bamfile";

    const clean_dir = "clean";
    await ensureDir(clean_dir);
    const fastqTrimmed = ["1_val_1.fq.gz", "2_val_2.fq.gz"].map((p) =>
      path.join(clean_dir, p)
    ) as [string, string];

    const cleanFastqSymlinked = (
      await Promise.all(
        fastqTrimmed.map((f) =>
          Deno.lstat(f)
            .then((s) => s.isSymlink)
            .catch((e) => assert(e instanceof Deno.errors.NotFound))
        ),
      )
    ).every(Boolean);

    if (cleanFastqSymlinked) {
      console.info("Symlinked clean fastq, skip fastp");
    } else {
      console.info("TASK: Running fastp");
      const fastqRaw = parseFastqOption(options);
      const fastq = await createLocalFastq(fastqRaw);
      await fastp(fastq, fastqTrimmed, { threads: threads > 2 ? 2 : threads });
    }

    await ensureDir(bam_dir);

    console.info("TASK: Alignment using BWA MEM");
    const bam_raw = path.join(bam_dir, getRawBam(sample, assembly));
    await bwaMem2(fastqTrimmed, bam_raw, {
      threads,
      readGroup: readGroup(sample),
      reference,
      fixmate: false,
    });
    await cleanup(...fastqTrimmed);

    // do sort after markdup, as markdupspark is optimized for queryname sorted bam

    console.info("END ALL ************************************* Bey");
  });
