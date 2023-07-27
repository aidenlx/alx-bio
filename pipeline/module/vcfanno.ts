import { $, tomlStringify } from "@/deps.ts";
import { checkDone } from "@/utils/check-done.ts";

export default async function vcfanno(
  input: string,
  output: string,
  options: {
    // deno-lint-ignore no-explicit-any
    config: any[];
    threads: number;
    args?: string[];
  }
) {
  const { done, finish } = await checkDone(output);
  if (done) {
    console.info("Skipping vcfanno");
    return output;
  }

  const cfgFile = await Deno.makeTempFile({ suffix: ".toml" });

  const config = { annotation: options.config };
  await Deno.writeTextFile(cfgFile, tomlStringify(config));
  const args = [
    ...["-p", options.threads],
    ...(options.args ?? []),
    ...[cfgFile, input],
  ];
  try {
    await $`vcfanno ${args} > ${output}`;
  } catch (error) {
    console.error("Failed to run vcfanno, config: ");
    console.error(tomlStringify(config));
    throw error;
  } finally {
    await Deno.remove(cfgFile);
  }

  await finish();
  return output;
}
