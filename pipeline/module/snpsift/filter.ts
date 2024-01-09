import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export const required = ["SnpSift"];

export default async function SnpSiftFilter(
  input: string,
  query: string,
  outputVcfGz: string,
  options: {
    memory?: string;
    args?: string[];
    javaOptions?: string[];
  } = {}
) {
  const { done, finish } = await checkDone(outputVcfGz, input, true);
  if (done) {
    console.error(`Skipping SnpSift Filter: ${outputVcfGz}`);
    return outputVcfGz;
  }

  const javaOptions = [
    ...(options.javaOptions ?? []),
    `-Xmx${options.memory ?? "8g"}`,
  ];
  const args = options.args ?? [];

  await $`zcat -f ${input} | SnpSift ${javaOptions} filter ${args} ${query} | bgzip > ${outputVcfGz}`;
  await finish();
  return outputVcfGz;
}
