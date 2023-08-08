// deno-lint-ignore-file no-explicit-any
import { csvParse, csvStringify } from "@/deps.ts";
import { scope } from "npm:arktype";

export const { Pedigree } = scope({
  sex: "parsedInteger",
  pheno: "string",
  Pedigree: {
    famId: "string",
    indId: "string",
    patId: "string",
    matId: "string",
    sex: "sex",
    pheno: "pheno",
  },
}).compile();

/**
 * @see https://gatk.broadinstitute.org/hc/en-us/articles/360035531972
 */
export function parsePedFile(content: string) {
  const data = csvParse(content, {
    columns: Object.keys(Pedigree.definition as Record<string, any>),
    separator: "\t",
  });
  return data.map((v, i) => {
    const r = Pedigree(v);
    if (!r.data) {
      console.error(`Invaild pedigree at line ${i + 1}:`, r.problems);
      throw new Error(`Invaild pedigree at line ${i + 1}:`);
    }
    return r.data;
  });
}

export function stringifyPedFile(ped: (typeof Pedigree.infer)[]) {
  return csvStringify(ped, {
    headers: false,
    separator: "\t",
    columns: Object.keys(Pedigree.definition as Record<string, any>),
    crlf: false,
  });
}
