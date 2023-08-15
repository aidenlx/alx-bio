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
  .option("--full", "Include all members even if no data available")
  .option("--keep-missing", "Output missing members in favor of placeholder 0")
  .arguments("<found>")
  .action(async (opts, found) => {
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
          (opts.full ? ped : ped.filter((v) => ids[v.indId])).map(
            ({ famId: _, indId, patId, matId, ...rest }) => ({
              famId: handleNonAscii(famId),
              indId: ids[indId] ?? handleNonAscii(indId),
              patId:
                ids[patId] ??
                (opts.full || opts.keepMissing ? handleNonAscii(patId) : "0"), // patId.replace(/^\?*/, "?"),
              matId:
                ids[matId] ??
                (opts.full || opts.keepMissing ? handleNonAscii(matId) : "0"), // matId.replace(/^\?*/, "?"),
              ...rest,
            })
          )
        )
      ).trim()
    );
  });
