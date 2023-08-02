import { $, tomlStringify } from "@/deps.ts";
import { checkDone } from "@/utils/check-done.ts";
import { overrideSymlink } from "./overrideSymlink.ts";

interface VcfAnnoConfigBase {
  file: string;
  names: string[];
  ops: string[];
}
export interface VcfAnnoConfigCol extends VcfAnnoConfigBase {
  columns: number[];
}

export interface VcfAnnoConfigField extends VcfAnnoConfigBase {
  fields: string[];
}

export type VcfAnnoConfig = VcfAnnoConfigCol | VcfAnnoConfigField;

export default async function vcfanno(
  input: string,
  output: string,
  options: {
    config: (VcfAnnoConfig | false)[];
    threads: number;
    args?: string[];
  }
) {
  const { done, finish } = await checkDone(
    output,
    input,
    output.replace(/\.gz$/, "")
  );
  if (done) {
    console.info("Skipping vcfanno");
    return output;
  }

  const cfgFile = await Deno.makeTempFile({ suffix: ".toml" });

  const config = {
    annotation: options.config.filter((v): v is VcfAnnoConfig => v !== false),
  };
  await Deno.writeTextFile(cfgFile, tomlStringify(config));
  const args = [
    ...["-p", options.threads],
    ...(options.args ?? []),
    ...[cfgFile, input],
  ];

  try {
    // avoid writing into symlinked source file
    await overrideSymlink(output, output + ".tbi");
    console.error("vcfanno config: ", tomlStringify(config));
    if (output.endsWith(".gz")) {
      await $`vcfanno ${args} | bgzip > ${output} && tabix -f -p vcf ${output}`;
    } else {
      await $`vcfanno ${args} > ${output}`;
    }
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
