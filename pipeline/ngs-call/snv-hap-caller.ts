import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { getGVcfGz, Res } from "@/pipeline/_res.ts";
import { cd, Command, ensureDir, exists, path } from "@/deps.ts";
import {
  defaultIntervalPadding,
  toIntervalScatter,
  validateOptions,
} from "@/pipeline/ngs-call/_common.ts";
import GATKHaplotypeCaller from "@/pipeline/module/gatk/haplotypeCaller.ts";

const dummpOptDesc = "dummy option to keep the same interface";

export default new Command()
  .name("snv.hap-caller")
  .description("GATK HaplotypeCaller")
  .option("--id <value:number>", "scatter id", { required: false })
  .option("-t, --threads <count:positiveInt>", dummpOptDesc, { default: 2 })
  .option("--bait-intervals [path]", dummpOptDesc, { collect: true })
  .option("--wgs-parallel", "run in WGS mode with parallel scatter")
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("--no-cleanup", dummpOptDesc)
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
    const { sample, workPath, assembly, reference } = await validateOptions(
      options,
    );

    cd(workPath);

    const scatterId = options.id ?? -1;

    const wgsParallelEnabled = options.wgsParallel && assembly === "hg38";
    const intervalPadding = options.wgsParallel
      ? undefined
      : options.intervalPadding;
    wgsParallelEnabled && console.error("WGS Parallel Enabled");

    const bam_dir = "bamfile";
    const bam_bqsr = path.join(bam_dir, `${sample}.bqsr.${assembly}.bam`);

    const vcf_dir = "vcf";
    ensureDir(vcf_dir);

    if (scatterId >= 0) {
      const interval_scatter = path.join(
        vcf_dir,
        toIntervalScatter(sample, assembly),
      );
      const scatterIdStr = scatterId.toString().padStart(4, "0");
      const intervals = path.join(
        interval_scatter,
        `${scatterIdStr}-scattered.interval_list`,
      );
      const output = path.join(
        interval_scatter,
        `${scatterIdStr}-scattered.g.vcf.gz`,
      );
      if (!await exists(intervals)) {
        throw new Error(`intervals file not found: ${intervals}`);
      }
      await GATKHaplotypeCaller(bam_bqsr, output, {
        reference,
        dbsnp: Res[assembly].dbsnp,
        intervals,
        intervalPadding,
        quiet: true,
        emitRefConfidence: "GVCF",
        args: ["--create-output-variant-index", "false"],
      });
    } else {
      const gVcfGz = path.join(vcf_dir, getGVcfGz(sample, assembly));
      await GATKHaplotypeCaller(bam_bqsr, gVcfGz, {
        // threads,
        reference,
        dbsnp: Res[assembly].dbsnp,
        memory: "20G",
        emitRefConfidence: "GVCF",
      });
    }
    console.info("TASK: HAPLOTYPE CALLING END for " + scatterId);
  });
