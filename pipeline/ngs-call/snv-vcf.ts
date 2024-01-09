import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { getGVcfGz, Res, wgsInterval } from "@/pipeline/_res.ts";
import { cd, Command, ensureDir, path, pLimit } from "@/deps.ts";
import {
  defaultIntervalPadding,
  getIntervals,
  toIntervalScatter,
  validateOptions,
} from "@/pipeline/ngs-call/_common.ts";
import gatherVCF from "@/pipeline/module/gatherVcf.ts";
import { parseBaitIntevals } from "@/pipeline/ngs-call/parseBaitIntevals.ts";
import GATKSplitIntervals from "@/pipeline/module/gatk/splitIntervals.ts";
import GATKHaplotypeCaller from "@/pipeline/module/gatk/haplotypeCaller.ts";
import { PositiveInt } from "@/utils/validate.ts";

export default new Command()
  .name("snv.vcf")
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

    const parallel = Math.floor(threads / 2);

    cd(workPath);

    const wgsParallelEnabled = options.wgsParallel && assembly === "hg38";
    const baitIntervals = wgsParallelEnabled
      ? wgsInterval.hg38
      : parseBaitIntevals(options.baitIntervals, assembly);
    const intervalPadding = options.wgsParallel
      ? undefined
      : options.intervalPadding;
    wgsParallelEnabled && console.error("WGS Parallel Enabled");

    console.info(`baitIntervals: ${baitIntervals ?? "Disabled"}`);

    const bam_dir = "bamfile";
    const bam_bqsr = path.join(bam_dir, `${sample}.bqsr.${assembly}.bam`);

    const vcf_dir = "vcf";
    ensureDir(vcf_dir);
    const gVcfGz = path.join(vcf_dir, getGVcfGz(sample, assembly));

    if (baitIntervals) {
      const limit = pLimit(parallel);

      const interval_scatter = path.join(
        vcf_dir,
        toIntervalScatter(sample, assembly),
      );
      console.info(`SPLIT TAG_REGION using ${baitIntervals}`);
      await GATKSplitIntervals(baitIntervals, interval_scatter, {
        reference,
        intervalPadding,
        threads,
        quiet: true,
      });
      const intervals = await getIntervals(interval_scatter);
      const toHcOutput = (list: string) =>
        list.replace(/\.interval_list$/, ".g.vcf.gz");
      const hcOutputs = intervals.map(toHcOutput);
      console.info("TASK: HaplotypeCaller");
      const hcTasks = intervals.map((list) =>
        limit(() =>
          GATKHaplotypeCaller(bam_bqsr, toHcOutput(list), {
            reference,
            dbsnp: Res[assembly].dbsnp,
            // threads,
            intervals: list,
            intervalPadding,
            quiet: true,
            emitRefConfidence: "GVCF",
            args: ["--create-output-variant-index", "false"],
          })
        )
      );
      await Promise.all(hcTasks);
      console.info("MERGE GVCF");
      await gatherVCF(hcOutputs, gVcfGz);
      await cleanup(...hcOutputs);
    } else {
      await GATKHaplotypeCaller(bam_bqsr, gVcfGz, {
        // threads,
        reference,
        dbsnp: Res[assembly].dbsnp,
        memory: "20G",
        emitRefConfidence: "GVCF",
      });
    }
    console.info("TASK: VCF CALLING END");
    console.info("END ALL ************************************* Bey");
  });
