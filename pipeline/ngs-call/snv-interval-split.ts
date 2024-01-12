import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { wgsInterval } from "@/pipeline/_res.ts";
import { cd, Command, ensureDir } from "@/deps.ts";
import {
  defaultIntervalPadding,
  getIntervals,
  toIntervalScatter,
  validateOptions,
} from "@/pipeline/ngs-call/_common.ts";
import { parseBaitIntevals } from "@/pipeline/ngs-call/parseBaitIntevals.ts";
import GATKSplitIntervals from "@/pipeline/module/gatk/splitIntervals.ts";
import { PositiveInt } from "@/utils/validate.ts";

export default new Command()
  .name("snv.interval-split")
  .description("Per-sample variant calling pipeline")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 2 })
  .option(
    "--bait-intervals [path]",
    "bed file for WESeq capture region, run in WGS mode if not present",
    { collect: true },
  )
  .option("--wgs-parallel", "run in WGS mode with parallel scatter")
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("--no-cleanup", "dummy option to keep the same interface")
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
    const { threads } = options;

    const parallel = Math.floor(threads / 2);

    ensureDir(workPath);
    cd(workPath);

    const wgsParallelEnabled = options.wgsParallel && assembly === "hg38";
    const baitIntervals = wgsParallelEnabled
      ? wgsInterval.hg38
      : parseBaitIntevals(options.baitIntervals, assembly);
    const intervalPadding = options.wgsParallel
      ? undefined
      : options.intervalPadding;
    wgsParallelEnabled && console.error("WGS Parallel Enabled");

    console.error(`baitIntervals: ${baitIntervals ?? "Disabled"}`);

    if (baitIntervals) {
      const interval_scatter = toIntervalScatter(sample, assembly);
      console.error(`SPLIT TAG_REGION using ${baitIntervals}`);
      await GATKSplitIntervals(baitIntervals, interval_scatter, {
        reference,
        intervalPadding,
        scatterCount: parallel,
        quiet: true,
      });
      const intervals = await getIntervals(interval_scatter);
      console.log(intervals.length);
    } else {
      console.error("Not parallel mode, skip split interval");
      console.log(-1)
    }
  });
