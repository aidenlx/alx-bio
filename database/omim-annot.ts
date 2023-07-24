import { csvParse, join } from "../deps.ts";

export default async function getOMIMAnnot(res: string) {
  const data = await Deno.readTextFile(
    join(res, "OMIM_Disease_Phenotype_Annot-2304.csv")
  ).then((raw) =>
    csvParse(raw, {
      skipFirstRow: true,
      delimiter: "\t",
      columns: [
        "mim_num",
        "prefix",
        "status",
        "Titles",
        "Preferred_Title_symbol",
        "Preferred_symbols",
        "Alternative_Titles_symbols",
        "Alternative_symbols",
        "Included_Titles_symbols",
        "Included_symbols",
        "Gene_symbols",
        "HGNC_symbol",
        "Inheritance",
        "clinicalSynopsis",
        "phenotype",
        "phenotypeMimNumber",
        "phenotypeClinicalSynopsis",
        "phenotypeInheritance",
        "phenotypeInheritance_abbrev",
        "phenotypeMappingKey",
        "cn_disease_local",
        "HPO_terms",
        "hpo_en_names",
        "hpo_cn_names",
      ],
    })
  );
  return Object.fromEntries(data.map((v) => [v.mim_num, v]));
}
