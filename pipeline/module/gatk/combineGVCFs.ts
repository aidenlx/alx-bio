import { checkDone } from "@/utils/check-done.ts";
import {
  GATKOptions,
  gatkTempDir,
  gatkTempDirJava,
  indexVcfGz,
  java,
} from "./_common.ts";
import { $ } from "@/deps.ts";
export { required } from "./_common.ts";

export default async function GATKCombineGVCFs(
  inputs: string[],
  output: string,
  opts: GATKOptions & {
    reference: string;
  }
) {
  const { done, finish } = await checkDone(
    output,
    inputs,
    output.replace(/\.gz$/, "")
  );
  if (done) {
    console.info("Skipping CombineGVCFs");
    return;
  }

  await indexVcfGz(...inputs);

  /** https://hpc.nih.gov/training/gatk_tutorial/genotype-gvcfs.html#optimized-script-4 */
  opts.javaOptions = [
    ...(opts.javaOptions ?? []),
    "-Xmx20G",
    "-Xms4G",
    "-XX:ParallelGCThreads=2",
    gatkTempDirJava(),
  ];

  const args = [
    ...(opts.args ?? []),
    ...gatkTempDir(),
    ...["--reference", opts.reference],
    ...inputs.flatMap((input) => ["-V", input]),
    ...["--output", output],
  ];
  if (output.endsWith(".gz")) {
    await $`gatk ${java(opts)} CombineGVCFs ${args} && \
tabix -f -p vcf ${output}`;
  } else {
    await $`gatk ${java(opts)} CombineGVCFs ${args}`;
  }
  await finish();
}
