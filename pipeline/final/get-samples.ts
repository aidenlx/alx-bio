import { $ } from "@/deps.ts";

export default async function getSamples(
  inputVcfGz: string,
  sampleMap?: string
) {
  const samples = (await $`bcftools query -l ${inputVcfGz}`).stdout
    .trim()
    .split("\n");
  if (sampleMap) {
    const map = (await Deno.readTextFile(sampleMap)).split("\n");
    return samples.map((_, i) => map[i].trim());
  }
  return samples;
}
