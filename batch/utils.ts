import { readAll, yamlParse } from "@/deps.ts";
import { scope } from "@/deps.ts";

export async function ArrayfromAsync<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) {
    out.push(x);
  }
  return out;
}

export function getMergedName(id: string, idx: number) {
  return `${id}_${idx + 1}.fq.gz`;
}

async function readFile(path: string): Promise<string> {
  if (path === "-") {
    const stdinContent = await readAll(Deno.stdin);
    return new TextDecoder().decode(stdinContent);
  }
  return await Deno.readTextFile(path);
}

/**
 * @returns 2023-01-17T07
 */
export function getDate() {
  return new Date().toISOString().slice(0, 13);
}

export async function getFound(
  foundFile: string
): Promise<FoundYaml | FoundYamlPed> {
  const yamlData = await readFile(foundFile).then(yamlParse);
  if (isFoundYaml(yamlData)) {
    return yamlData;
  } else if (isFoundYamlPed(yamlData)) {
    return yamlData;
  }
  throw new Error(`Invalid found file: ${foundFile}`);
}

export function flatFounds(yaml: FoundYamlPed): FoundYaml[] {
  return Object.values(yaml).filter(
    (v): v is FoundYaml => typeof v !== "string"
  );
}

const { fqPairs, versionPed } = scope({
  fqPair: ["string", "string"],
  fqPairs: "fqPair[]",
  versionPed: {
    __version__: "'ped'",
  },
}).compile();

export type FoundYaml = Record<string, typeof fqPairs.infer>;
export type FoundYamlPed = Record<string, FoundYaml> & { __version__: "ped" };

export function isFoundYaml(data: unknown): data is FoundYaml {
  return (
    typeof data === "object" &&
    data !== null &&
    !Object.hasOwn(data, "__version__") &&
    Object.values(data).every((v) => {
      const check = fqPairs.allows(v);
      if (!check) console.error("invalid fq pair", v);
      return check;
    })
  );
}
export function isFoundYamlPed(data: unknown): data is FoundYamlPed {
  if (!versionPed.allows(data)) {
    console.error("version header not ped");
    return false;
  }
  return Object.entries(data).every(([k, v]) => {
    if (k === "__version__") return true;
    const check = isFoundYaml(v);
    if (!check) console.error("invalid found yaml", v);
    return check;
  });
}

export const defaultMergeDir = "/genetics/home/stu_liujiyuan/analysis/merge";
