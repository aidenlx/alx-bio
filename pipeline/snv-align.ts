import { Command } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";

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
  .action(() => {
    throw new Error("Not implemented");
  });
// .action(async (options) => {
//   const { join: j } = path;

//   const threads = toPositiveInt(options.threads);
//   if (threads === null) {
//     throw new Error("threads must be a positive integer");
//   }

//   const workPath = path.resolve(options.outDir),
//     sample = options.sample;
//   if (nonAscii.test(workPath)) {
//     throw new Error(
//       "work path should not contain non-ascii characters: " + workPath
//     );
//   }
//   if (nonAscii.test(sample)) {
//     throw new Error(
//       "sample name should not contain non-ascii characters: " + sample
//     );
//   }

//   await fs.ensureDir(workPath);
//   cd(workPath);

//   const assembly = options.ref as SupportAssembly;
//   const reference = Res[assembly].refFa;

//   const cleanup = genCleanupFunc(options);

//   const bam_dir = "bamfile";

//   const fastqRaw = parseFastqOption(options);
//   const fastq = await createLocalFastq(fastqRaw);
//   const clean_dir = "clean";
//   await fs.ensureDir(clean_dir);
//   const fastqTrimmed = [
//     j(clean_dir, "1_val_1.fq.gz"),
//     j(clean_dir, "2_val_2.fq.gz"),
//   ] as [string, string];

//   console.info("TASK: Running fastp");
//   await fastp(fastq, fastqTrimmed, { threads });

//   await fs.ensureDir(bam_dir);

//   console.info("TASK: Alignment using BWA MEM");
//   const bam_raw = j(bam_dir, `${sample}.${assembly}.bam`);
//   await bwaMem2(fastqTrimmed, bam_raw, {
//     threads,
//     readGroup: readGroupNGS(sample),
//     reference,
//   });
//   await cleanup(...fastqTrimmed);

//   console.info("TASK: BAM SORT");
//   const bam_sort = j(bam_dir, `${sample}.sort.${assembly}.bam`);
//   await samtoolsSort(bam_raw, bam_sort, { threads, memory: "4G" });
//   await cleanup(bam_raw);

//   console.info("TASK: MarkDuplicates");
//   const bam_markdup = j(bam_dir, getMarkDupBam(sample, assembly));
//   if (options.spark ?? false) {
//     await GATKMarkDuplicatesSpark(
//       bam_sort,
//       {
//         bam: bam_markdup,
//         metrics: j(bam_dir, `${sample}.metrics.${assembly}.txt`),
//       },
//       { threads }
//     );
//   } else {
//     await GATKMarkDuplicates(
//       bam_sort,
//       {
//         bam: bam_markdup,
//         metrics: j(bam_dir, `${sample}.metrics.${assembly}.txt`),
//       },
//       { threads }
//     );
//   }
//   await cleanup(bam_sort);

//   // const bam_markdupIndex =
//   await samtoolsIndex(bam_markdup, { threads });
//   // return { bam_markdup, bam_markdupIndex };

//   console.info("END ALL ************************************* Bey");
// });
