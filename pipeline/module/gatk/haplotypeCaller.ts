import { checkDone } from "@/utils/check-done.ts";
import { GATKOptions, gatkTempDir, gatkTempDirJava, java } from "./_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function GATKHaplotypeCaller(
  input: string,
  output: string,
  opts: GATKOptions & {
    reference: string;
    memory?: string;
    threads: number;
    emitRefConfidence?: "NONE" | "GVCF" | "BP_RESOLUTION";
    dbsnp: string;
    intervals?: string;
    intervalPadding?: number;
    quiet?: boolean;
  }
) {
  const { done, finish } = await checkDone(
    output,
    input,
    output.replace(/\.gz$/, "")
  );
  if (done) {
    console.info(`Skipping HaplotypeCaller ${output}`);
    return;
  }

  const threads = opts.threads >= 4 ? 4 : opts.threads;

  /** https://hpc.nih.gov/training/gatk_tutorial/haplotype-caller.html */
  opts.javaOptions = [
    ...(opts.javaOptions ?? []),
    `-Xmx${opts.memory ?? "20G"}`,
    /** don't allocate min memory if not explictly specify */
    opts.memory ? `-Xms${opts.memory}` : "",
    `-XX:ParallelGCThreads=${threads}`,
    gatkTempDirJava(),
  ];

  const args = [
    ...(opts.args ?? []),
    ...gatkTempDir(),
    ...["-R", opts.reference, "--dbsnp", opts.dbsnp],
    ...["--native-pair-hmm-threads", threads],
    ...["-I", input, "-O", output],
    ...["--emit-ref-confidence", opts.emitRefConfidence ?? "NONE"],
    opts.quiet ? "--QUIET" : "",
  ];
  const intervalArgs = [
    ...(opts.intervals ? ["--intervals", opts.intervals] : []),
    ...(opts.intervalPadding
      ? [`--interval-padding`, opts.intervalPadding]
      : []),
  ];
  await $`gatk ${java(opts)} HaplotypeCaller ${args} ${intervalArgs}`;
  await finish();
}
