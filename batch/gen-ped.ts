import { Command } from "@/deps.ts";
import {
  getFound,
  flatFounds,
  isFoundYamlPed,
  extractPed,
  getSampleId,
} from "./utils.ts";
import { stringifyPedFile } from "@/batch/ped.ts";
import { handleNonAscii } from "@/utils/ascii.ts";

export default new Command()
  .name("pl.gen.ped")
  .description("Generate ped file from found yaml")
  .arguments("<found>")
  .action(async (_opts, found) => {
    const data = await getFound(found);
    if (!isFoundYamlPed(data)) {
      throw new Error("Not a found yaml with pedigree");
    }
    const pedigrees = extractPed(data);
    const ids = Object.fromEntries(
      flatFounds(data)
        .flatMap((yml) => Object.keys(yml))
        .map((k, i, arr) => [k, getSampleId(k, i, arr.length)])
    );

    console.log(
      stringifyPedFile(
        pedigrees.flatMap(([famId, ped]) =>
          ped
            .filter((v) => ids[v.indId])
            .map(({ famId: _, indId, patId, matId, ...rest }) => ({
              famId: handleNonAscii(famId),
              indId: ids[indId],
              patId: ids[patId] ?? "0", // patId.replace(/^\?*/, "?"),
              matId: ids[matId] ?? "0", // matId.replace(/^\?*/, "?"),
              ...rest,
            }))
        )
      ).trim()
    );
  });
