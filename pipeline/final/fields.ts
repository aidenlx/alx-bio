import { localAC, localAF } from "@/pipeline/_res.ts";
import hg19FieldList from "./vcf-extract.json" assert { type: "json" };
import hg19ExomiserFieldList from "./vcf-extract-exomiser.json" assert { type: "json" };
import slivarFieldList from "./vcf-extract-slivar.json" assert { type: "json" };
import slivarFieldListCompHet from "./vcf-extract-slivar-ch.json" assert { type: "json" };
import { assertNever } from "@/utils/assert-never.ts";

const slivar_placeholder = "#SLIVAR#";

export interface ExtractOptions {
  local?: boolean;
  /** compound-hets: result from slivar comp-het */
  slivar?: "compound-hets" | "expr";
}

function _getFieldList(
  assembly: "hg19" | "hg38",
  fieldList: string[],
  { local = true, slivar }: ExtractOptions = {}
): string[] {
  if (fieldList.length === 0) {
    throw new Error("fieldList is empty: " + fieldList);
  }

  if (!slivar) {
    fieldList = fieldList.filter((k) => k !== slivar_placeholder);
  } else {
    const pos = fieldList.indexOf(slivar_placeholder);
    if (pos === -1)
      throw new Error("slivar_placeholder not found in fieldList");
    fieldList = fieldList
      .slice(0, pos)
      .concat(
        slivarFieldList,
        slivar === "compound-hets" ? slivarFieldListCompHet : [],
        fieldList.slice(pos + 1)
      );
  }

  const localFreq = new Set([localAC, localAF]);
  if (assembly === "hg38") {
    fieldList = fieldList.map((v) => v.replace("gnomad_g211_", "gnomad312_"));
    // if (!local) {
    //   list = list.filter((k) => !localFreq.has(k));
    // }
    // local database has no hg38 data yet
    fieldList = fieldList.filter((k) => !localFreq.has(k));
    return fieldList;
  } else if (assembly === "hg19") {
    if (!local) {
      fieldList = fieldList.filter((k) => !localFreq.has(k));
    }
    return fieldList.filter((k) => !localFreq.has(k));
  } else {
    assertNever(assembly);
  }
}

export function getFieldList(assembly: "hg19" | "hg38", opts?: ExtractOptions) {
  return _getFieldList(assembly, hg19FieldList, opts);
}

export function getExomiserFieldList(
  assembly: "hg19" | "hg38",
  opts?: ExtractOptions
) {
  // if (hg19ExomiserFieldList.some((f) => !hg19FieldList.includes(f))) {
  //   throw new Error("ExomiserFieldList contains fields not in FieldList");
  // }
  return _getFieldList(assembly, hg19ExomiserFieldList, opts);
}
