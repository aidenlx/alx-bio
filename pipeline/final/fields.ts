import { localAC, localAF, localNumHomAlt } from "@/pipeline/_vcfanno.ts";
import hg19FieldList from "./vcf-extract.json" assert { type: "json" };
import hg19QualFieldList from "./vcf-extract-qual.json" assert { type: "json" };
import hg19ExomiserFieldList from "./vcf-extract-exomiser.json" assert { type: "json" };
import slivarFieldList from "./vcf-extract-slivar.json" assert { type: "json" };
import slivarFieldListCompHet from "./vcf-extract-slivar-ch.json" assert { type: "json" };
import { assertNever } from "@/utils/assert-never.ts";

const slivar_placeholder = "#SLIVAR#",
  qual_placeholder = "#QUAL#";

export interface ExtractOptions {
  local?: boolean;
  /** compound-hets: result from slivar comp-het */
  slivar?: "compound-hets" | "expr";
  qualFields?: boolean;
}

function _getFieldList(
  assembly: "hg19" | "hg38",
  fieldList: string[],
  { local = true, slivar, qualFields = true }: ExtractOptions = {}
): string[] {
  if (fieldList.length === 0) {
    throw new Error("fieldList is empty: " + fieldList);
  }

  if (!qualFields) {
    fieldList = fieldList.filter((k) => k !== qual_placeholder);
  } else {
    const pos = fieldList.indexOf(qual_placeholder);
    if (pos !== -1) {
      fieldList = fieldList
        .slice(0, pos)
        .concat(hg19QualFieldList, fieldList.slice(pos + 1));
    }
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

  const localFreq = new Set([localAC, localAF, localNumHomAlt]);
  if (assembly === "hg38") {
    fieldList = fieldList.map((v) => v.replace("gnomad_g211_", "gnomad312_"));

    // local database has no hg38 data yet
    // deno-lint-ignore no-constant-condition
    if (true) {
      fieldList = fieldList.filter((k) => !localFreq.has(k));
    }
    return fieldList;
  } else if (assembly === "hg19") {
    if (!local) {
      fieldList = fieldList.filter((k) => !localFreq.has(k));
    }
    return fieldList;
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
