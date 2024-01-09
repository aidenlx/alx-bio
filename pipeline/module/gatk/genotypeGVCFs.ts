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

export default async function GATKGenotypeGVCFs(
  input: string,
  output: string,
  opts: GATKOptions & {
    reference: string;
    standardMinConfidenceThresholdForCalling?: number;
  }
) {
  /**
   * @see https://gatk.broadinstitute.org/hc/en-us/articles/360037057852-GenotypeGVCFs#--standard-min-confidence-threshold-for-calling
   */
  const standCallConf = opts.standardMinConfidenceThresholdForCalling ?? 0;
  const { done, finish } = await checkDone(
    output,
    input,
    output.replace(/\.gz$/, "")
  );
  if (done) {
    console.error("Skipping GenotypeGVCFs");
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
    ...["-stand-call-conf", standCallConf],
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
