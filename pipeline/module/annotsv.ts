import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export const required = ["AnnotSV"];

export type SupportedRef = "hg19" | "hg38";

const refMap = {
  hg19: "GRCh37",
  hg38: "GRCh38",
};

export default async function AnnotSV(
  input: string,
  outBase: string,
  opts: {
    reference: SupportedRef;
    opts?: string[];
  }
) {
  const { done, finish } = await checkDone(outBase, input);

  if (done) {
    console.error("Skipping AnnotSV");
    return;
  }

  const svOpts = [
    ...(opts.opts ?? []),
    ...["-genomeBuild", refMap[opts.reference]],
  ];

  await $`AnnotSV -SVinputFile ${input} -outputFile ${outBase} ${svOpts}`;

  await finish();
}
