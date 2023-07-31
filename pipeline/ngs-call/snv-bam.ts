import { Command, cd, path, pLimit } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { KnownSites, getMarkDupBam } from "@/pipeline/_res.ts";
import {
  defaultIntervalPadding,
  getIntervals,
  toIntervalScatter,
  vaildateOptions,
} from "@/pipeline/ngs-call/_common.ts";
import { parseBaitIntevals } from "@/pipeline/ngs-call/parseBaitIntevals.ts";
import GATKSplitIntervals from "@/pipeline/module/gatk/splitIntervals.ts";
import GATKBaseRecalibrator from "@/pipeline/module/gatk/baseRecal.ts";
import GATKGatherBQSRReports from "@/pipeline/module/gatk/gatherBQSRReports.ts";
import GATKApplyBQSR from "@/pipeline/module/gatk/applyBQSR.ts";
import samtoolsIndex from "@/pipeline/module/samtools/index.ts";

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
  .option("--interval-padding <val:integer>", "interval padding", {
    default: defaultIntervalPadding,
  })
  .action(async (options) => {
    const { sample, threads, workPath, assembly, cleanup, reference } =
      await vaildateOptions(options);
    cd(workPath);

    const baitIntervals = parseBaitIntevals(options.baitIntervals, assembly);
    console.info(`Interval: ${baitIntervals ?? "Disabled"}`);

    const knownSites = KnownSites[assembly];

    const bam_dir = "bamfile";
    const bam_bqsr = path.join(bam_dir, `${sample}.bqsr.${assembly}.bam`);
    const bam_markdup = path.join(bam_dir, getMarkDupBam(sample, assembly));

    const interval_scatter = path.join(
      bam_dir,
      toIntervalScatter(sample, assembly)
    );

    if (baitIntervals) {
      const limit = pLimit(threads);
      console.info(`SPLIT TAG_REGION using ${baitIntervals}`);
      await GATKSplitIntervals(baitIntervals, interval_scatter, {
        reference,
        intervalPadding: options.intervalPadding,
        threads,
        quiet: true,
      });

      const intervals = await getIntervals(interval_scatter);
      const toBrOutput = (list: string) =>
        list.replace(/\.interval_list$/, ".recal.table");
      const brTasks = intervals.map((list) =>
        limit(() =>
          GATKBaseRecalibrator(bam_markdup, toBrOutput(list), {
            intervals: list,
            intervalPadding: options.intervalPadding,
            quiet: true,
            reference,
            knownSites,
          })
        )
      );
      await Promise.all(brTasks);

      console.info("MERGE BaseRecalibrator");

      const bqsr_tab = path.join(bam_dir, `${sample}.recal.${assembly}.table`);
      await GATKGatherBQSRReports(intervals.map(toBrOutput), bqsr_tab, {
        args: ["--QUIET"],
      });

      console.info("TASK: ApplyBQSR");
      await GATKApplyBQSR({ bam: bam_markdup, bqsr: bqsr_tab }, bam_bqsr, {
        reference,
      });
      await cleanup(bqsr_tab, ...intervals.map(toBrOutput));
    } else {
      console.info("TASK: BaseRecalibrator");
      const recal = path.join(bam_dir, `${sample}.recal.${assembly}.table`);

      await GATKBaseRecalibrator(bam_markdup, recal, {
        reference,
        knownSites: KnownSites[assembly],
      });

      console.info("TASK: ApplyBQSR");
      await GATKApplyBQSR({ bam: bam_markdup, bqsr: recal }, bam_bqsr, {
        reference,
      });
      await cleanup(recal);
    }
    console.info("TASK: BAM INDEXING");
    await samtoolsIndex(bam_bqsr, { threads });

    console.info("END ALL ************************************* Bey");
  });
