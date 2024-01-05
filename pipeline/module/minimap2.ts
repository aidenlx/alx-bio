import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export const required = ["minimap2", "samtools"];

export default async function minimap2(
  input: string,
  output: string,
  opts: {
    /** true by default */
    sort?: boolean;
    threads: number;
    /** fasta file */
    reference: string;
    readGroup: string;
    preset?: string;
    minimapOpts?: string[];
  }
) {
  const { done, finish } = await checkDone(output, input);
  if (done) {
    console.info("Skipping minimap2");
    return;
  }
  const minimapOpts = [
    ...(opts.minimapOpts ?? []),
    ...["-t", opts.threads, "-R", opts.readGroup],
    ...(opts.preset ? ["-x", opts.preset] : []),
  ];
  const sort = opts.sort ?? true;

  /** -b output sam; -S input sam; -bS: convert sam to bam */
  await $`minimap2 -a ${minimapOpts} ${opts.reference} ${input} | \
    samtools ${sort ? "sort" : "view"} -@ ${opts.threads} -o ${output}`;
  await finish();
}
