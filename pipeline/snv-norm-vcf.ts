import { Command, cd, join } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { Res, getRawGz, getNormGz } from "@/pipeline/_res.ts";
import bcftoolsNorm from "@/pipeline/module/bcftools/norm.ts";
import { validateOptions } from "./ngs-call/_common.ts";

export const mergeVersion = "." + "v2";

export default new Command()
  .name("snv.norm-vcf")
  .description("")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <name:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-o, --out-dir <DIR>", "Output directory", { required: true })
  .option("-s, --sample <name>", "Sample Name", { required: true })
  .action(async (options) => {
    const { sample, workPath, assembly } = await validateOptions(
      options,
    );
    const reference = Res[assembly].refFa;

    cd(join(workPath, "vcf"));

    const rawVcfGz = getRawGz(sample, assembly),
      normVcfGz = getNormGz(sample, assembly)

    console.info("normalize vcf");
    // split multiallelic variants into biallelic variants
    // required by annovar
    await bcftoolsNorm(rawVcfGz, normVcfGz, { fastaRef: reference });
  });
