import { Command, ensureDir, path } from "@/deps.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { nonAscii } from "@/utils/ascii.ts";
import { Res } from "@/pipeline/_res.ts";
import GATKCombineGVCFs from "@/pipeline/module/gatk/combineGVCFs.ts";
import GATKGenotypeGVCFs from "@/pipeline/module/gatk/genotypeGVCFs.ts";
import bcftoolsNorm from "@/pipeline/module/bcftools/norm.ts";

export default new Command()
  .name("snv.merge")
  .description("Pipeline to consolidate GVCFs and perform joint genotyping")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-o, --output <path>", "output vcf prefix", { required: true })
  .option("-r, --ref <name:genomeAssembly>", "reference genome", {
    required: true,
  })
  .arguments("<input...>")
  .action(async (options, ...gvcfInputs) => {
    const output = options.output.replace(/\.+?$/, "");

    if (gvcfInputs.length === 0) {
      throw new Error("output and gvcf inputs are required");
    }

    if ([...gvcfInputs, output].some((s) => s && nonAscii.test(s))) {
      throw new Error("work path should not contain non-ascii characters");
    }

    await ensureDir(path.dirname(output));

    const assembly = options.ref;
    const reference = Res[assembly].refFa;

    const gVcfGz = `${output}.g.${assembly}.vcf.gz`,
      rawVcfGz = `${output}.raw.${assembly}.vcf.gz`,
      normVcfGz = `${output}.norm.${assembly}.vcf.gz`;

    if (gvcfInputs.length > 1) {
      console.error(
        `Merging ${gvcfInputs.length} gvcfs: \n${gvcfInputs.join("\n")}`
      );
      await GATKCombineGVCFs(gvcfInputs, gVcfGz, { reference });
      console.info("GenotypeGVCFs, inputs: " + gvcfInputs.join(", "));
      await GATKGenotypeGVCFs(gVcfGz, rawVcfGz, { reference });
      console.info("normalize vcf");
      // split multiallelic variants into biallelic variants
      // required by annovar
      await bcftoolsNorm(rawVcfGz, normVcfGz);
    } else {
      console.info("GenotypeGVCFs, inputs: " + gvcfInputs.join(", "));
      await GATKGenotypeGVCFs(gvcfInputs[0], rawVcfGz, { reference });
      console.info("normalize vcf");
      await bcftoolsNorm(rawVcfGz, normVcfGz);
    }

    console.info("END ALL ************************************* Bey");
  });
