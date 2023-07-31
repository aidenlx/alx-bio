import { csvParse, join } from "../deps.ts";

// const url = "https://www.omim.org/static/omim/data/mim2gene.txt";

const columns = [
  /**
   * MIM Number
   */
  "mim_num",
  /**
   * MIM Entry Type
   * @see https://omim.org/help/faq FAQ 1.3
   */
  "type",
  /**
   * Entrez Gene ID (NCBI)
   */
  "ncbi_gene_id",
  /**
   * Approved Gene Symbol (HGNC)
   */
  "hgnc_symbol",
  /**
   * Ensembl Gene ID (Ensembl)
   */
  "ens_gene_id",
] as const;

export default async function getOMIMGene(res: string) {
  const data = await Deno.readTextFile(join(res, "mim2gene.txt")).then((raw) =>
    csvParse(raw, {
      separator: "\t",
      skipFirstRow: false,
      columns,
      comment: "#",
    })
  );
  const index: Partial<
    Record<
      "id" | "symbol" | "ncbi_id" | "omim_id",
      Record<string, (typeof data)[number]>
    >
  > = {};
  // group by gene_symbol
  return {
    get symbol() {
      return (index.symbol ??= Object.fromEntries(
        data.filter((v) => v.type === "gene").map((v) => [v.hgnc_symbol, v])
      ));
    },
    get id() {
      return (index.id ??= Object.fromEntries(
        data.filter((v) => v.type === "gene").map((v) => [v.ens_gene_id, v])
      ));
    },
    get ncbi_id() {
      return (index.ncbi_id ??= Object.fromEntries(
        data.filter((v) => v.type === "gene").map((v) => [v.ncbi_gene_id, v])
      ));
    },
    get omim_id() {
      return (index.ncbi_id ??= Object.fromEntries(
        data.filter((v) => v.type === "gene").map((v) => [v.mim_num, v])
      ));
    },
  };
}
