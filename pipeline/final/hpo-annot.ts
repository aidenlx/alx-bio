import getHPODisease from "@/database/hpo-disease.ts";
import getHPOPhenotype from "@/database/hpo-phenotype.ts";
import getHPOTranslate from "@/database/hpo-cn.ts";
import { CsvStringifyStream, CsvParseStream, fmtBytes } from "@/deps.ts";
// import getOMIMAnnot from "../database/omim-annot.ts";
import getORPHA from "@/database/orpha.ts";
import getOMIMTranslate from "@/database/omim-cn.ts";
import getHPOData from "@/database/hpo-name.ts";
// import { Command, fmtDuration } from "../deps.ts";

const separator = "\t";

const GTMap: Record<string, string> = {
  "1/1": "Hom/",
  "1/0": "Het/",
  "0/1": "Het/",
  "0/0": "Ref/",
  "./.": "MIS/",
  "1|1": "Hom|",
  "1|0": "Het|",
  "0|1": "Het|",
  "0|0": "Ref|",
  ".|.": "MIS|",
};
const GTSymbolMap: Record<string, string> = {
  Hom: "●",
  Ref: "◎",
  Het: "◐",
  MIS: "○",
};
const dedupeFields = new Set(["ANN[*].GENE"]);

const newColumnsAfterCADD = {
  hpo_disease_cn: "",
  hpo_phenotype_cn: "",
  hpo_disease: "",
  hpo_phenotype: "",
  HOM_COUNT: -1,
  HET_COUNT: -1,
} satisfies Record<string, string | number>;
const newColumnsPrepend = {
  ID: "",
  GT_SYMBOL: "",
  HOM_PCT: -1,
  HET_PCT: -1,
} satisfies Record<string, string | number>;
const newColumnsAfterGene = {
  gene_omim: "",
} satisfies Record<string, string | number>;

function uniq(arrStr: string, delimiter = ",") {
  const arr = arrStr.split(delimiter);
  return [...new Set(arr)].join(delimiter);
}

import getOMIMGene from "@/database/mim2gene.ts";
import printStdErr from "@/utils/print-stderr.ts";
import { checkDone } from "@/utils/check-done.ts";
import { ExtractOptions, getFieldList } from "@/pipeline/final/fields.ts";

export default async function ExtractAndHpoAnnot(
  inputVcf: string,
  outputTsvGz: string,
  {
    samples,
    assembly,
    database,
    ...extractOpts
  }: {
    assembly: "hg19" | "hg38";
    samples: string[];
    database: HpoData;
  } & ExtractOptions
) {
  const { done, finish } = await checkDone(outputTsvGz, inputVcf);
  if (done) {
    console.info("Skipping hpo annot");
    return outputTsvGz;
  }
  console.error(`Extracting from ${inputVcf}...`);

  const fieldList = getFieldList(assembly, extractOpts);
  const hpoAnnot = HpoAnnot({ samples, database });
  const output = await Deno.open(outputTsvGz, {
    create: true,
    write: true,
    truncate: true,
  });
  const bgzip = new Deno.Command("bgzip", {
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const extractFields = new Deno.Command("SnpSift", {
    args: [
      "extractFields",
      ...["-s", ","],
      ...["-e", "."],
      inputVcf,
      ...fieldList,
    ],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  printStdErr(extractFields.stderr);
  printStdErr(bgzip.stderr);

  const pipea = extractFields.stdout
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new CsvParseStream({
        skipFirstRow: false,
        separator,
      })
    )
    .pipeThrough(hpoAnnot)
    .pipeThrough(new CsvStringifyStream({ separator, crlf: false }))
    .pipeThrough(new TextEncoderStream())
    .pipeTo(bgzip.stdin);
  const pipeb = bgzip.stdout.pipeTo(output.writable);

  await Promise.all([pipea, pipeb]);
  const eStatus = await extractFields.status,
    bStatus = await bgzip.status;
  if (!eStatus.success) {
    throw new Error("extractFields failed: " + eStatus.code);
  }
  if (!bStatus.success) {
    throw new Error("bgzip failed: " + bStatus.code);
  }
  await finish();
  return outputTsvGz;
}

type HpoData = Awaited<ReturnType<typeof loadHpoData>>;
export async function loadHpoData(resDir: string) {
  const [
    hpoDisease,
    hpoPhenotype,
    hpoTranslate,
    hpoData,
    omimTranslate,
    orpha,
    mim2gene,
    // omimAnnot,
  ] = await Promise.all([
    getHPODisease(resDir),
    getHPOPhenotype(resDir),
    getHPOTranslate(resDir),
    getHPOData(resDir),
    getOMIMTranslate(resDir),
    getORPHA(resDir),
    getOMIMGene(resDir),
    // getOMIMAnnot(res),
  ]);
  console.error(`Memory usage: ${fmtBytes(Deno.memoryUsage().heapTotal)}`);
  return {
    hpoDisease,
    hpoPhenotype,
    hpoTranslate,
    hpoData,
    omimTranslate,
    orpha,
    mim2gene,
  };
}

function HpoAnnot({
  database: {
    hpoDisease,
    hpoPhenotype,
    hpoTranslate,
    hpoData,
    omimTranslate,
    orpha,
    mim2gene,
  },
  samples,
}: {
  samples: string[];
  database: HpoData;
}) {
  console.error(`sample: ${samples.join(",")}`);

  // performance.mark("process_start");

  let header: string[] | undefined;

  const sampleGTColumns = Object.fromEntries(samples.map((k) => [k, ""]));
  const idColumns = ["CHROM", "POS", "REF", "ALT"];
  const gtCol = "GEN[*].GT",
    geneCol = "ANN[0].GENE",
    geneIdCol = "ANN[0].GENEID",
    CADDCol = "CADD_PHRED";
  const excludeCols = new Set([...idColumns, gtCol]);
  return new TransformStream({
    transform(chunk: string[], controller) {
      if (!header) {
        header = chunk;
        [...idColumns, gtCol, geneCol, geneIdCol, CADDCol].forEach((v) => {
          if (!chunk.includes(v)) {
            throw new Error(`Missing required columns ${v}: ${chunk}`);
          }
        });

        controller.enqueue([
          ...idColumns.map((v, i) => (i === 0 ? `#${v}` : v)),
          ...Object.keys(newColumnsPrepend),
          ...chunk
            .slice(0, chunk.indexOf(geneCol) + 1)
            .filter((c) => !excludeCols.has(c)),
          ...Object.keys(newColumnsAfterGene),
          ...chunk
            .slice(chunk.indexOf(geneCol) + 1, chunk.indexOf(CADDCol) + 1)
            .filter((c) => !excludeCols.has(c)),
          ...Object.keys(newColumnsAfterCADD),
          ...chunk
            .slice(chunk.indexOf(CADDCol) + 1)
            .filter((c) => !excludeCols.has(c)),
          ...Object.keys(sampleGTColumns),
        ]);
        return;
      }
      const data = Object.fromEntries(header.map((k, i) => [k, chunk[i]]));

      const colsPrepend = { ...newColumnsPrepend };
      const colsAfterCADD = { ...newColumnsAfterCADD };
      const colsAfterGene = { ...newColumnsAfterGene };
      colsPrepend.ID = idColumns
        .map((key) => data[key])
        .join("-")
        .replace(/^chr/, "");
      const GT = data[gtCol].split(",");
      if (GT.length !== samples.length) {
        throw new Error(
          `GT length not match, expected ${samples}(${samples.length}), got ${GT.length}: ${GT}`
        );
      }
      const homCount = GT.map((v) => GTMap[v]).filter((v) =>
        v.startsWith("Hom")
      ).length;
      colsAfterCADD.HOM_COUNT = homCount;
      colsPrepend.HOM_PCT = homCount / GT.length;
      // `${homCount}/${GT.length}~${homCount / GT.length}`;
      const hetCount = GT.map((v) => GTMap[v]).filter((v) =>
        v.startsWith("Het")
      ).length;
      colsAfterCADD.HET_COUNT = hetCount;
      colsPrepend.HET_PCT = hetCount / GT.length;
      // `${hetCount}/${GT.length}~${hetCount / GT.length}`;
      colsPrepend.GT_SYMBOL = GT.map((v) =>
        GTMap[v] ? GTSymbolMap[GTMap[v].slice(0, -1)] : "?"
      ).join("");
      GT.forEach((v, i) => {
        sampleGTColumns[samples[i]] = GTMap[v] ?? v;
      });

      const gene = data[geneCol],
        geneID = data[geneIdCol];
      if (geneID && mim2gene.id[geneID]) {
        colsAfterGene.gene_omim = mim2gene.id[geneID].mim_num;
        // colsAppend.gene_omim_type = mim2gene.id[geneID].type;
      } else if (gene && mim2gene.symbol[gene]) {
        colsAfterGene.gene_omim = mim2gene.symbol[gene].mim_num;
        // colsAppend.gene_omim_type = mim2gene.symbol[gene].type;
      }

      const phenoSource = geneID
        ? hpoPhenotype.id[geneID]
        : gene
        ? hpoPhenotype.symbol[gene]
        : null;
      if (phenoSource) {
        const ids = phenoSource.map((row) => row.hpo_id.substring(3));
        colsAfterCADD.hpo_phenotype = ids.join("|");
        colsAfterCADD.hpo_phenotype_cn = ids
          .map((id) => getHPOPhenotypeName(id))
          .join("|");
        // colsAppend.hpo_phenotype_en = ids
        //   .map((id) => getHPOPhenotypeName(id, false))
        //   .join("|");
      }

      const diseaseSource = geneID
        ? hpoDisease.id[geneID]
        : gene
        ? hpoDisease.symbol[gene]
        : null;
      if (diseaseSource) {
        const ids = diseaseSource.map((row) => row.disease_id);
        colsAfterCADD.hpo_disease = ids.join("|");
        colsAfterCADD.hpo_disease_cn = ids.map((v) => getDisease(v)).join("|");
        // colsAppend.hpo_disease_en = ids
        //   .map((v) => getDisease(v, false))
        //   .join("|");
      }

      const processValue = ([key, v]: [key: string, v: string]) => {
        if (dedupeFields.has(key)) v = uniq(v);
        return v.replace(/\\x3b/g, ";");
      };
      const geneColIdx = header.indexOf(geneCol),
        CADDColIdx = header.indexOf(CADDCol);
      controller.enqueue([
        ...idColumns.map((key) => data[key]),
        ...Object.values(colsPrepend),
        ...Object.entries(data)
          .slice(0, geneColIdx + 1)
          .filter(([k]) => !excludeCols.has(k))
          .map(processValue),
        ...Object.values(colsAfterGene),
        ...Object.entries(data)
          .slice(geneColIdx + 1, CADDColIdx + 1)
          .filter(([k]) => !excludeCols.has(k))
          .map(processValue),
        ...Object.values(colsAfterCADD),
        ...Object.entries(data)
          .slice(CADDColIdx + 1)
          .filter(([k]) => !excludeCols.has(k))
          .map(processValue),
        ...Object.values(sampleGTColumns),
      ]);
    },
  });

  // console.error(
  //   `process done, took ${fmtDuration(
  //     performance.measure("process", "process_start").duration
  //   )}`
  // );
  function getDisease(v: string, cn = true): string {
    let name: string | undefined, source: string | undefined;
    if (v.startsWith("ORPHA:")) {
      name = orpha[v.substring(6)]?.name;
      source = "ORPHA";
    } else if (v.startsWith("OMIM:")) {
      const d = omimTranslate[v.substring(5)];
      name =
        d &&
        ((cn ? d.cnTitle : null) ?? d.preTitle ?? d.altTitle ?? d.incTitle);
      source = "OMIM";
    }
    if (!name || !source) {
      return v;
    } else {
      return `${source}:${name}`;
    }
  }

  function getHPOPhenotypeName(id: string, cn = true) {
    return (
      (cn ? hpoTranslate[id]?.name_cn : null) ?? hpoData[id]?.name ?? `HP:${id}`
    );
  }
}
