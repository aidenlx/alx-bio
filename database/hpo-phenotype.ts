import { csvParse, groupBy, join } from "../deps.ts";

// const url = "http://purl.obolibrary.org/obo/hp/hpoa/genes_to_phenotype.txt";

const columns = [
  "ncbi_gene_id",
  "gene_symbol",
  "hpo_id",
  "hpo_name",
  "frequency",
  "disease_id",
] as const;

export default async function getHPOPhenotype(res: string) {
  const data = await Deno.readTextFile(
    join(res, "genes_to_phenotype.txt")
  ).then((raw) =>
    csvParse(raw, { separator: "\t", skipFirstRow: true, columns })
  );
  // group by gene_symbol
  return groupBy(data, (row) => row.gene_symbol);
}
