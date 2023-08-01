import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { Res } from "@/pipeline/_res.ts";
import { Command, cd, ensureDir, exists, pLimit, path } from "@/deps.ts";
import {
  toIntervalScatter,
  vaildateOptions,
  defaultIntervalPadding,
  getIntervals,
} from "@/pipeline/ngs-call/_common.ts";
import gatherVCF from "@/pipeline/module/gatherVcf.ts";
import { parseBaitIntevals } from "@/pipeline/ngs-call/parseBaitIntevals.ts";
import GATKSplitIntervals from "@/pipeline/module/gatk/splitIntervals.ts";
import GATKHaplotypeCaller from "@/pipeline/module/gatk/haplotypeCaller.ts";

export default new Command()
  .name("snv.vcf")
  .description("Per-sample variant calling pipeline")
  .option("-t, --threads <count:integer>", "Threads", { default: 4 })
  .option(
    "--bait-intervals [path]",
    "bed file for WESeq capture region, run in WGS mode if not present",
    { collect: true }
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

    console.info(`baitIntervals: ${baitIntervals ?? "Disabled"}`);

    const bam_dir = "bamfile";
    const bam_bqsr = path.join(bam_dir, `${sample}.bqsr.${assembly}.bam`);

    const vcf_dir = "vcf";
    ensureDir(vcf_dir);
    const gVcfGz = path.join(vcf_dir, `${sample}.g.${assembly}.vcf.gz`);

    if (baitIntervals) {
      const limit = pLimit(threads);

      const interval_scatter_legacy = path.join(
        bam_dir,
        toIntervalScatter(sample, assembly)
      );
      const toHcOutput = (list: string) =>
        list.replace(/\.interval_list$/, ".g.vcf.gz");

      let intervals = await getIntervals(interval_scatter_legacy);

      if (
        !(
          intervals.length > 0 &&
          // if all gvcf exists
          (await Promise.all(
            intervals.map(toHcOutput).map((p) => exists(p))
          ).then((r) => r.every(Boolean)))
        )
      ) {
        const interval_scatter = path.join(
          vcf_dir,
          toIntervalScatter(sample, assembly)
        );

        console.info(`SPLIT TAG_REGION using ${baitIntervals}`);

        await GATKSplitIntervals(baitIntervals, interval_scatter, {
          reference,
          intervalPadding: options.intervalPadding,
          threads,
          quiet: true,
        });

        intervals = await getIntervals(interval_scatter);
      }

      console.info("TASK: HaplotypeCaller");

      const hcTasks = intervals.map((list) =>
        limit(() =>
          GATKHaplotypeCaller(bam_bqsr, toHcOutput(list), {
            reference,
            dbsnp: Res[assembly].dbsnp,
            threads,
            intervals: list,
            intervalPadding: options.intervalPadding,
            quiet: true,
            emitRefConfidence: "GVCF",
            args: ["--create-output-variant-index", "false"],
          })
        )
      );
      await Promise.all(hcTasks);

      console.info("MERGE GVCF");
      const hcOutputs = intervals.map(toHcOutput);

      await gatherVCF(hcOutputs, gVcfGz);
      // await GATKGatherVcfs(intervals.map(toHcOutput), unsortedGVcf, {
      //   args: ["--QUIET"],
      // });
      await cleanup(...hcOutputs);
    } else {
      await GATKHaplotypeCaller(bam_bqsr, gVcfGz, {
        threads,
        reference,
        dbsnp: Res[assembly].dbsnp,
        memory: "20G",
        emitRefConfidence: "GVCF",
      });
    }
    console.info("TASK: VCF CALLING END");
    console.info("END ALL ************************************* Bey");
  });
