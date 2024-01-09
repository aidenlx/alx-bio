import { checkDone } from "@/utils/check-done.ts";
import { $, basename } from "@/deps.ts";

export const required = ["fastp"];

export default async function fastp(
  [iForward, iReverse]: [string, string],
  [oForward, oReverse]: [string, string],
  options: {
    threads: number;
    args?: string[];
  }
) {
  const doneFile = `${basename(iForward)}.fastqc`;
  const { done, finish } = await checkDone(
    doneFile,
    [iForward, iReverse],
    true
  );
  if (done) {
    console.error("Skipping fastp");
    return;
  }
  const args = [
    ...(options.args ?? []),
    ...["-w", options.threads],
    ...["-i", iForward, "-I", iReverse],
    ...["-o", oForward, "-O", oReverse],
  ];
  await $`fastp ${args}`;
  await finish();
}
