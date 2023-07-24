import { join } from "../deps.ts";

export interface HPO {
  definition_en: string | null;
  definition_cn: string | null;
  related: string[];
  omim: string[];
  hpoId: string;
  category: string;
  name_cn: string;
  name_en: string;
}

export default async function getHPOTranslate(res: string) {
  const data = await Deno.readTextFile(join(res, "hpo-cn-0627.json")).then(
    (raw) => raw.split("\n").map((line) => JSON.parse(line) as HPO)
  );
  return Object.fromEntries(
    data.map((v) => [v.hpoId.substring(3) /** remove HP: prefix */, v])
  );
}
