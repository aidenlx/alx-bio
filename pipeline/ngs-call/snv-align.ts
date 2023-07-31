import { Command, path, ensureDir, cd } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import {
  getMarkDupBam,
  parseFastqOption,
  readGroupNGS,
} from "@/pipeline/_res.ts";
import { createLocalFastq } from "@/utils/ln-fastq.ts";
import { vaildateOptions } from "@/pipeline/ngs-call/_common.ts";
import fastp from "@/pipeline/module/fastp.ts";
import bwaMem2 from "@/pipeline/module/bwa-mem2.ts";
import samtoolsSort from "@/pipeline/module/samtools/sort.ts";
import samtoolsIndex from "@/pipeline/module/samtools/index.ts";
import GATKMarkDuplicates from "@/pipeline/module/gatk/markDup.ts";
import GATKMarkDuplicatesSpark from "@/pipeline/module/gatk/markDupSpark.ts";

export default new Command()
  .name("snv.align")
  .description("Initial short-read sequence alignment pipeline")
  .option("-t, --threads <count:integer>", "Threads", { default: 4 })
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
  .option("--spark", "Spark")
  .action(async (options) => {
    const { sample, threads, workPath, assembly, cleanup, reference } =
      await vaildateOptions(options);
    cd(workPath);

    const bam_dir = "bamfile";

    const fastqRaw = parseFastqOption(options);
    const fastq = await createLocalFastq(fastqRaw);
    const clean_dir = "clean";
    await ensureDir(clean_dir);
    const fastqTrimmed = ["1_val_1.fq.gz", "2_val_2.fq.gz"].map((p) =>
      path.join(clean_dir, p)
    ) as [string, string];

    console.info("TASK: Running fastp");
    await fastp(fastq, fastqTrimmed, { threads });

    await ensureDir(bam_dir);

    console.info("TASK: Alignment using BWA MEM");
    const bam_raw = path.join(bam_dir, `${sample}.${assembly}.bam`);
    await bwaMem2(fastqTrimmed, bam_raw, {
      threads,
      readGroup: readGroupNGS(sample),
      reference,
    });
    await cleanup(...fastqTrimmed);

    console.info("TASK: BAM SORT");
    const bam_sort = path.join(bam_dir, `${sample}.sort.${assembly}.bam`);
    await samtoolsSort(bam_raw, bam_sort, { threads, memory: "4G" });
    await cleanup(bam_raw);

    console.info("TASK: MarkDuplicates");
    const bam_markdup = path.join(bam_dir, getMarkDupBam(sample, assembly)),
      metrics = path.join(bam_dir, `${sample}.metrics.${assembly}.txt`);
    if (options.spark) {
      await GATKMarkDuplicatesSpark(
        bam_sort,
        { bam: bam_markdup, metrics },
        { threads }
      );
    } else {
      await GATKMarkDuplicates(
        bam_sort,
        { bam: bam_markdup, metrics },
        { threads }
      );
    }
    await cleanup(bam_sort);

    await samtoolsIndex(bam_markdup, { threads });

    console.info("END ALL ************************************* Bey");
  });
