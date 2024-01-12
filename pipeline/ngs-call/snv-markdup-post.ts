import { cd, Command, path } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { getMarkDupBam, getTagBam, Res } from "@/pipeline/_res.ts";
import { validateOptions } from "@/pipeline/ngs-call/_common.ts";
import { PositiveInt } from "@/utils/validate.ts";
import GATKSetNmMdAndUqTags from "@/pipeline/module/gatk/setNmMdAndUqTags.ts";

export default new Command()
  .name("snv.markdup-post")
  .description("SetNmMdAndUqTags")
  .type("positiveInt", PositiveInt)
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("--no-cleanup", "skip cleanup, keep intermedia files")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <assembly:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .action(async (options) => {
    const { sample, workPath, assembly, cleanup } =
      await validateOptions(options);

    cd(workPath);

    const bam_dir = "bamfile";

    const bam_markdup = path.join(bam_dir, getMarkDupBam(sample, assembly));

    // markdupspark coord-sort bam implictly, do

    console.info("TASK: BAM SetNmMdAndUqTags");
    const bam_sort = path.join(bam_dir, getTagBam(sample, assembly));
    await GATKSetNmMdAndUqTags(bam_markdup, bam_sort, { reference: Res[assembly].refFa });
    await cleanup(bam_markdup);

    console.info("END ALL ************************************* Bey");
  });
