import { checkDoneV2 } from "@/utils/check-done.ts";
import { samtoolsTemp } from "@/pipeline/module/samtools/_common.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function samtoolsSort(
  input: string,
  output: string,
  options: {
    threads: number;
    /** max memory per thread; suffix K/M/G recognized [768M] */
    memory: string;
    args?: string[];
  }
) {
  const { done, finish } = await checkDoneV2(output, input, output);
  if (done) {
    console.info("Skipping samtools sort");
    return;
  }
  const args = [
    ...(options.args ?? []),
    ...["-@", options.threads, "-m", options.memory],
    ...samtoolsTemp(output),
    ...["-o", output],
    input,
  ];
  await $`samtools sort ${args}`;
  await finish();
}
