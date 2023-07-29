import { Command } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { defaultIntervalPadding } from "@/pipeline/_res.ts";

export default new Command()
  .name("snv.bam")
  .description("Prepare raw mapped bam reads for varinat calling")
  .option("-t, --threads <count:integer>", "Threads", { default: 4 })
  .option(
    "--bait-intervals [path]",
    "bed file for WESeq capture region, run in WGS mode if not present"
  )
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("--no-cleanup", "skip cleanup, keep intermedia files")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <assembly:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .option("--interval-padding <integer>", "interval padding", {
    default: defaultIntervalPadding,
  })
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

//   const baitIntervals = parseBaitIntevals(options.baitIntervals, assembly);
//   console.info(`Interval: ${baitIntervals ?? "Disabled"}`);

//   const refFa = Res[assembly].refFa,
//     knownSites = KnownSites[assembly];

//   const cleanup = genCleanupFunc(options);

//   const bam_dir = "bamfile";
//   const bam_bqsr = j(bam_dir, `${sample}.bqsr.${assembly}.bam`);
//   const bam_markdup = j(bam_dir, getMarkDupBam(sample, assembly));

//   if (baitIntervals) {
//     const interval_scatter = j(bam_dir, toIntervalScatter(sample, assembly));
//     const limit = pLimit(threads);
//     const getIntervals = () => glob(`${interval_scatter}/*.interval_list`);

//     console.info(`SPLIT TAG_REGION using ${baitIntervals}`);
//     await GATKSplitIntervals(baitIntervals, interval_scatter, {
//       reference: refFa,
//       intervalPadding,
//       threads,
//       quiet: true,
//     });

//     const intervals = await getIntervals();
//     const toBrOutput = (list: string) =>
//       list.replace(/\.interval_list$/, ".recal.table");
//     const brTasks = intervals.map((list) =>
//       limit(() =>
//         GATKBaseRecalibrator(bam_markdup, toBrOutput(list), {
//           intervals: list,
//           intervalPadding,
//           quiet: true,
//           reference: refFa,
//           knownSites,
//         })
//       )
//     );
//     await Promise.all(brTasks);

//     console.info("MERGE BaseRecalibrator");

//     const bqsr_tab = j(bam_dir, `${sample}.recal.${assembly}.table`);
//     await GATKGatherBQSRReports(intervals.map(toBrOutput), bqsr_tab, {
//       args: ["--QUIET"],
//     });

//     console.info("TASK: ApplyBQSR");
//     await GATKApplyBQSR({ bam: bam_markdup, bqsr: bqsr_tab }, bam_bqsr, {
//       reference: refFa,
//     });
//     await cleanup(bqsr_tab, ...intervals.map(toBrOutput));
//   } else {
//     console.info("TASK: BaseRecalibrator");
//     const recal = j(bam_dir, `${sample}.recal.${assembly}.table`);

//     await GATKBaseRecalibrator(bam_markdup, recal, {
//       reference: refFa,
//       knownSites: KnownSites[assembly],
//     });

//     console.info("TASK: ApplyBQSR");
//     await GATKApplyBQSR({ bam: bam_markdup, bqsr: recal }, bam_bqsr, {
//       reference: refFa,
//     });
//     await cleanup(recal);
//   }
//   console.info("TASK: BAM INDEXING");
//   await samtoolsIndex(bam_bqsr, { threads });

//   console.info("END ALL ************************************* Bey");
// });
