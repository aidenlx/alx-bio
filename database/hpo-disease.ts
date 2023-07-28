import { csvParse, groupBy, join } from "../deps.ts";

// const url = "http://purl.obolibrary.org/obo/hp/hpoa/genes_to_disease.txt";

const columns = [
  "ncbi_gene_id",
  "gene_symbol",
  "association_type",
  "disease_id",
  "source",
  "ensembl_id",
] as const;

export default async function getHPODisease(res: string) {
  const data = await Deno.readTextFile(join(res, "genes_to_disease.txt")).then(
    (raw) => csvParse(raw, { separator: "\t", skipFirstRow: true, columns })
  );
  // group by gene_symbol
  return {
    symbol: groupBy(data, (row) => row.gene_symbol),
    id: groupBy(data, (row) => row.ensembl_id),
  };
}
