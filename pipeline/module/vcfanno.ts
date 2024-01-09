import { $, tomlStringify } from "@/deps.ts";
import { checkDone } from "@/utils/check-done.ts";
import { overrideSymlink } from "./overrideSymlink.ts";

interface VcfAnnoAnnotConfigBase {
  file: string;
  names: string[];
  ops: string[];
}

// const customLuaScript = ``;

export interface VcfAnnoAnnotConfigCol extends VcfAnnoAnnotConfigBase {
  columns: number[];
}

export interface VcfAnnoAnnotConfigField extends VcfAnnoAnnotConfigBase {
  fields: string[];
}

export interface VcfAnnoPostAnnotConfig {
  name: string;
  fields: string[];
  op: string;
  type: "String" | "Float" | "Integer";
}

export type VcfAnnoAnnotConfig =
  | VcfAnnoAnnotConfigCol
  | VcfAnnoAnnotConfigField;

export default async function vcfanno(
  input: string,
  output: string,
  options: {
    config: {
      annotation: (VcfAnnoAnnotConfig | false)[];
      postannotation?: (VcfAnnoPostAnnotConfig | false)[];
    };
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
    console.error("Skipping vcfanno");
    return output;
  }

  const cfgFile = await Deno.makeTempFile({ suffix: ".toml" });
  // const luaScriptFile = await Deno.makeTempFile({ suffix: ".lua" });

  const config = {
    annotation: options.config.annotation.filter(
      (v): v is VcfAnnoAnnotConfig => v !== false
    ),
    postannotation: (options.config.postannotation ?? []).filter(
      (v): v is VcfAnnoPostAnnotConfig => v !== false
    ),
  };
  await Deno.writeTextFile(cfgFile, tomlStringify(config));
  // await Deno.writeTextFile(luaScriptFile, customLuaScript);
  const args = [
    ...["-p", options.threads],
    ...(options.args ?? []),
    // ...["-lua", luaScriptFile],
    ...[cfgFile, input],
  ];

  try {
    // avoid writing into symlinked source file
    await overrideSymlink(output, output + ".tbi");
    console.error("vcfanno config: ", tomlStringify(config));
    // console.error("vcfanno config: ", JSON.stringify(config));
    if (output.endsWith(".gz")) {
      await $`vcfanno ${args} | bgzip > ${output} && tabix -f -p vcf ${output}`;
    } else {
      await $`vcfanno ${args} > ${output}`;
    }
    await finish();
    return output;
  } catch (error) {
    console.error("Failed to run vcfanno, config: ");
    console.error(tomlStringify(config));
    throw error;
  } finally {
    await Deno.remove(cfgFile).catch(() => void 0);
    // await Deno.remove(luaScriptFile).catch(() => void 0);
  }
}
