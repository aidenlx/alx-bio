import { cd, Command, path } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import {
  getTagBam,
  KnownSites,
  wgsInterval,
} from "@/pipeline/_res.ts";
import {
  defaultIntervalPadding,
  toIntervalScatter,
  validateOptions,
} from "@/pipeline/ngs-call/_common.ts";
import { parseBaitIntevals } from "@/pipeline/ngs-call/parseBaitIntevals.ts";
import GATKBaseRecalibrator from "@/pipeline/module/gatk/baseRecal.ts";
import { PositiveInt } from "@/utils/validate.ts";

export default new Command()
  .name("snv.bqsr-run")
  .description("Prepare raw mapped bam reads for varinat calling")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 4 })
  .option(
    "--bait-intervals [path]",
    "bed file for WESeq capture region, run in WGS mode if not present",
    { collect: true },
  )
  .option("--id <value:number>", "scatter id", { required: false })
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
    const { sample, workPath, assembly, reference } =
      await validateOptions(options);
    cd(workPath);

    const scatterId = options.id ?? -1;
    const scatterIdStr = scatterId.toString().padStart(4, "0");

    const wgsParallelEnabled = options.wgsParallel && assembly === "hg38";
    const baitIntervals = wgsParallelEnabled
      ? wgsInterval.hg38
      : parseBaitIntevals(options.baitIntervals, assembly);
    const intervalPadding = options.wgsParallel
      ? undefined
      : options.intervalPadding;
    wgsParallelEnabled && console.error("WGS Parallel Enabled");

    console.info(`Interval: ${baitIntervals ?? "Disabled"}`);

    const knownSites = KnownSites[assembly];

    const bam_dir = "bamfile";
    const bam_sort = path.join(bam_dir, getTagBam(sample, assembly));

    const interval_scatter = path.join(
      bam_dir,
      toIntervalScatter(sample, assembly),
    );

    if (baitIntervals) {
      console.info("TASK: BaseRecalibrator for " + scatterId);
      const intervals = path.join(
        interval_scatter,
        `${scatterIdStr}-scattered.interval_list`,
      );
      const output = path.join(
        interval_scatter,
        `${scatterIdStr}-scattered.recal.table`,
      );
      await GATKBaseRecalibrator(bam_sort, output, {
        intervals: intervals,
        intervalPadding,
        reference,
        knownSites,
      });
    } else {
      console.info("TASK: BaseRecalibrator");
      const recal = path.join(bam_dir, `${sample}.recal.${assembly}.table`);

      await GATKBaseRecalibrator(bam_sort, recal, {
        reference,
        knownSites: KnownSites[assembly],
      });
    }
    console.info("END ALL ************************************* Bey");
  });
