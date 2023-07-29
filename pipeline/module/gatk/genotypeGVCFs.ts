import { checkDoneV2 } from "@/utils/check-done.ts";
import {
  GATKOptions,
  gatkTempDir,
  gatkTempDirJava,
  indexVcfGz,
  java,
} from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKGenotypeGVCFs(
  input: string,
  output: string,
  opts: GATKOptions & {
    reference: string;
  }
) {
  const { done, finish } = await checkDoneV2(output, input, output);
  if (done) {
    console.info("Skipping GenotypeGVCFs");
    return;
  }

  await indexVcfGz(input);

  /** https://hpc.nih.gov/training/gatk_tutorial/genotype-gvcfs.html#optimized-script-4 */
  opts.javaOptions = [
    ...(opts.javaOptions ?? []),
    "-Xmx2G",
    "-Xms2G",
    "-XX:ParallelGCThreads=2",
    gatkTempDirJava(),
  ];

  const args = [
    ...(opts.args ?? []),
    ...gatkTempDir(),
    ...["--reference", opts.reference],
    ...["--variant", input, "--output", output],
  ];
  if (output.endsWith(".gz")) {
    await $`gatk ${java(opts)} GenotypeGVCFs ${args} \
&& tabix -f -p vcf ${output}`;
  } else {
    await $`gatk ${java(opts)} GenotypeGVCFs ${args}`;
  }

  await finish();
}
