import { $, ensureDir, join } from "@/deps.ts";
import { checkDone } from "@/utils/check-done.ts";
import { Res } from "@/pipeline/_res.ts";

export const required = ["SVision"];

export type SupportedRef = "hs37" | "hg19" | "hg38";

export const defaultModel =
  "/cluster/home/shiyan/PLAAT4/CNN_model/svision-cnn-model.ckpt";

export default async function SVision(
  input: string,
  outDir: string,
  opts: {
    sample: string;
    threads: number;
    /** fasta file */
    reference: SupportedRef;
    model: string;
    opts?: string[];
  }
) {
  const { done, finish } = await checkDone(outDir, input);
  const output = {
    source: join(outDir, `${opts.sample}.svision.s5.graph.vcf`),
    compat: join(outDir, `${opts.sample}.annotsv.vcf`),
  };

  if (done) {
    console.info("Skipping SVision");
    return output;
  }

  await ensureDir(outDir);
  const svOpts = [
    ...(opts.opts ?? []),
    ...["-g", Res[opts.reference].refFa, "-n", opts.sample],
    ...["-m", opts.model, "-t", opts.threads],
    ...["-b", input, "-o", outDir],
    ...["--graph", "--qname"],
  ];

  /** -b output sam; -S input sam; -bS: convert sam to bam */
  await $`SVision ${svOpts}`;

  /**
   * extract SVTYPE to <ALT>
   * @see https://github.com/lgmgeo/AnnotSV/blob/97e767363a6104f16658f972411ba24b73a495b2/changeLog.txt#L58
   */
  await $`awk -F '\\t' 'BEGIN {OFS="\\t"} {split($8, info, ";"); for (i in info) {if (info[i] ~ /^SVTYPE=/) {split(info[i], svtype, "="); $5="<"svtype[2]">"}}; print}' \
    ${output.source} > ${output.compat}`;

  await finish();

  return output;
}
