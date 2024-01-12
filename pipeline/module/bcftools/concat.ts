import { checkDone, optOptional } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function bcftoolsConcat(
  inputs: string[],
  output: string,
  options: {
    allowOverlaps?: boolean;
    naive?: boolean;
    args?: string[];
  } = {},
) {
  const { done, finish } = await checkDone(output, inputs);
  if (done) {
    console.error("Skipping bcftools view");
    return output;
  }
  const args = [
    ...optOptional(options.naive, "--naive"),
    ...optOptional(options.allowOverlaps, "--allow-overlaps"),
    ...(options.args ?? []),
  ];
  if (output.endsWith(".gz")) {
    await $`bcftools view ${args} ${inputs} -Oz -o ${output} && tabix -f -p vcf ${output}`;
  } else {
    await $`bcftools view ${args} ${inputs} > ${output}`;
  }
  await finish();
  return output;
}
