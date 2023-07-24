import { join } from "../deps.ts";
import type { OrphaData } from "../deno-csv/utils/gen-orpha.ts";

export default async function getORPHA(res: string) {
  const data = await Deno.readTextFile(join(res, "orpha.json")).then(
    (raw) => (JSON.parse(raw.split("\n")[1]) as OrphaData).data
  );
  return data;
}
