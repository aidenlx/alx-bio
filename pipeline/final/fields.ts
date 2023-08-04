import { localAC, localAF } from "@/pipeline/_res.ts";
import hg19FieldList from "./vcf-extract.json" assert { type: "json" };
import hg19ExomiserFieldList from "./vcf-extract-exomiser.json" assert { type: "json" };
import { assertNever } from "@/utils/assert-never.ts";

function _getFieldList(
  assembly: "hg19" | "hg38",
  fieldList: string[],
  { local = true }: { local?: boolean }
): string[] {
  if (fieldList.length === 0) {
    throw new Error("fieldList is empty: " + fieldList);
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
    return hg19FieldList.filter((k) => !localFreq.has(k));
  } else {
    assertNever(assembly);
  }
}

export function getFieldList(
  assembly: "hg19" | "hg38",
  { local = true }: { local?: boolean }
) {
  return _getFieldList(assembly, hg19FieldList, { local });
}

export function getExomiserFieldList(
  assembly: "hg19" | "hg38",
  { local = true }: { local?: boolean }
) {
  if (hg19ExomiserFieldList.some((f) => !hg19FieldList.includes(f))) {
    throw new Error("ExomiserFieldList contains fields not in FieldList");
  }
  return _getFieldList(assembly, hg19ExomiserFieldList, { local });
}
