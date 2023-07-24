import { join } from "../deps.ts";
import type { HPO } from "./hpo-cn.ts";

interface OMIM {
  preTitle: string;
  cnTitle: string;
  incTitle: string;
  prefix: string;
  hpo: HPO[];
  mimNumber: number;
  altTitle: string;
}

export default async function getOMIMTranslate(res: string) {
  const data = await Deno.readTextFile(join(res, "omim-cn-0627.json")).then(
    (raw) => raw.split("\n").map((line) => JSON.parse(line) as OMIM)
  );

  return Object.fromEntries(data.map((v) => [v.mimNumber, v]));
}
