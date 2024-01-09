import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { getGVcfGz } from "@/pipeline/_res.ts";
import { cd, Command, ensureDir, path } from "@/deps.ts";
import {
  getIntervals,
  toIntervalScatter,
  validateOptions,
  defaultIntervalPadding
} from "@/pipeline/ngs-call/_common.ts";
import gatherVCF from "@/pipeline/module/gatherVcf.ts";
import { PositiveInt } from "@/utils/validate.ts";

const dummpOptDesc = "dummy option to keep the same interface";

export default new Command()
  .name("snv.hap-merge")
  .description("Per-sample variant calling pipeline")
  .type("positiveInt", PositiveInt)
  .option("-t, --threads <count:positiveInt>", dummpOptDesc, { default: 2 })
  .option("--bait-intervals [path]", dummpOptDesc, { collect: true })
  .option("--wgs-parallel", dummpOptDesc)
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("--no-cleanup", "skip cleanup, keep intermedia files")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <assembly:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .option("--interval-padding <val:integer>", dummpOptDesc, {
    default: defaultIntervalPadding,
  })
  .action(async (options) => {
    const { sample, workPath, assembly, cleanup } = await validateOptions(
      options,
    );

    cd(workPath);

    const vcf_dir = "vcf";
    ensureDir(vcf_dir);
    const gVcfGz = path.join(vcf_dir, getGVcfGz(sample, assembly));

    const interval_scatter = path.join(
      vcf_dir,
      toIntervalScatter(sample, assembly),
    );
    const intervals = await getIntervals(interval_scatter);
    const toHcOutput = (list: string) =>
      list.replace(/\.interval_list$/, ".g.vcf.gz");
    const hcOutputs = intervals.map(toHcOutput);
    console.info("MERGE GVCF");
    await gatherVCF(hcOutputs, gVcfGz);
    await cleanup(...hcOutputs);

    console.info("TASK: GVCF MERGE END");
  });
