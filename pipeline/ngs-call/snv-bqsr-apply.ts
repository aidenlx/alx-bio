import { cd, Command, path } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { getBqsrBam, getTagBam, wgsInterval } from "@/pipeline/_res.ts";
import {
  defaultIntervalPadding,
  getIntervals,
  toIntervalScatter,
  validateOptions,
} from "@/pipeline/ngs-call/_common.ts";
import { parseBaitIntevals } from "@/pipeline/ngs-call/parseBaitIntevals.ts";
import GATKGatherBQSRReports from "@/pipeline/module/gatk/gatherBQSRReports.ts";
import GATKApplyBQSR from "@/pipeline/module/gatk/applyBQSR.ts";
import samtoolsIndex from "@/pipeline/module/samtools/index.ts";
import { PositiveInt } from "@/utils/validate.ts";

export default new Command()
  .name("snv.bqsr-apply")
  .description("Prepare raw mapped bam reads for varinat calling")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 2 })
  .option(
    "--bait-intervals [path]",
    "bed file for WESeq capture region, run in WGS mode if not present",
    { collect: true },
  )
  .option("--wgs-parallel", "run in WGS mode with parallel scatter")
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
    const { sample, workPath, assembly, cleanup, reference } =
      await validateOptions(options);
    const { threads } = options;
    cd(workPath);

    const wgsParallelEnabled = options.wgsParallel && assembly === "hg38";
    const baitIntervals = wgsParallelEnabled
      ? wgsInterval.hg38
      : parseBaitIntevals(options.baitIntervals, assembly);
    wgsParallelEnabled && console.error("WGS Parallel Enabled");

    console.info(`Interval: ${baitIntervals ?? "Disabled"}`);


    const bam_dir = "bamfile";
    const bam_bqsr = path.join(bam_dir, getBqsrBam(sample, assembly));
    const bam_sort = path.join(bam_dir, getTagBam(sample, assembly));

    const interval_scatter = path.join(
      bam_dir,
      toIntervalScatter(sample, assembly),
    );

    console.info("TASK: apply bqsr");
    if (baitIntervals) {
      const intervals = await getIntervals(interval_scatter);
      const toBrOutput = (list: string) =>
        list.replace(/\.interval_list$/, ".recal.table");

      const bqsr_tab = path.join(bam_dir, `${sample}.recal.${assembly}.table`);
      await GATKGatherBQSRReports(intervals.map(toBrOutput), bqsr_tab, {
        args: ["--QUIET"],
      });

      await GATKApplyBQSR({ bam: bam_sort, bqsr: bqsr_tab }, bam_bqsr, {
        reference,
      });
      await cleanup(bqsr_tab, ...intervals.map(toBrOutput));
    } else {
      const recal = path.join(bam_dir, `${sample}.recal.${assembly}.table`);
      await GATKApplyBQSR({ bam: bam_sort, bqsr: recal }, bam_bqsr, {
        reference,
      });
      await cleanup(recal);
    }
    console.info("TASK: BAM INDEXING");
    await samtoolsIndex(bam_bqsr, { threads });

    console.info("END ALL ************************************* Bey");
  });
