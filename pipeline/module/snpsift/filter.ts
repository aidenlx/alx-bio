import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export const required = ["SnpSift"];

export default async function SnpSiftFilter(
  inputVcf: string,
  query: string,
  outputTsvGz: string,
  options: {
    memory?: string;
    args?: string[];
    javaOptions?: string[];
  } = {}
) {
  const { done, finish } = await checkDone(outputTsvGz, inputVcf, true);
  if (done) {
    console.info(`Skipping SnpSift Filter: ${outputTsvGz}`);
    return;
  }

  const javaOptions = [
    ...(options.javaOptions ?? []),
    `-Xmx${options.memory ?? "8g"}`,
  ];
  const args = options.args ?? [];

  await $`zcat -f ${inputVcf} | SnpSift ${javaOptions} filter ${args} ${query} | bgzip > ${outputTsvGz}`;
  await finish();
}
