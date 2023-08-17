import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export { required } from "./_common.ts";

export default async function bcftoolsView(
  input: string,
  output: string,
  options: {
    args?: string[];
  } = {}
) {
  const { done, finish } = await checkDone(output, input);
  if (done) {
    console.info("Skipping bcftools view");
    return output;
  }
  const args = [...(options.args ?? [])];
  if (output.endsWith(".gz")) {
    await $`bcftools view ${args} ${input} -Oz -o ${output} && tabix -f -p vcf ${output}`;
  } else {
    await $`bcftools view ${args} ${input} > ${output}`;
  }
  await finish();
  return output;
}
