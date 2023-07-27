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
const dedupeFields = ["ANN[*].GENE"] as const;

const newColumnsAppend = {
  hpo_disease: "",
  hpo_disease_cn: "",
  hpo_disease_en: "",
  hpo_phenotype: "",
  hpo_phenotype_cn: "",
  hpo_phenotype_en: "",
} satisfies Record<string, string>;

function uniq(arrStr: string, delimiter = ",") {
  const arr = arrStr.split(delimiter);
  return [...new Set(arr)].join(delimiter);
}

import hg19FieldList from "./vcf-extract-hg19.json" assert { type: "json" };
import hg38FieldList from "./vcf-extract-hg38.json" assert { type: "json" };

export default async function ExtractAndHpoAnnot(
  inputVcf: string,
  outputTsv: string,
  {
    samples,
    assembly,
    resDir,
  }: { assembly: "hg19" | "hg38"; samples: string[]; resDir: string }
) {
  const fieldList = assembly === "hg38" ? hg38FieldList : hg19FieldList;
  if (fieldList.length === 0) {
    throw new Error("fieldList is empty: " + fieldList);
  }

  const hpoAnnot = await HpoAnnot({
    samples,
    resDir,
  });
  const output = await Deno.open(outputTsv, {
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
}

async function HpoAnnot({
  resDir,
  samples,
}: {
  samples: string[];
  resDir: string;
}) {
  console.error(`sample: ${samples.join(",")}`);
  const [
    hpoDisease,
    hpoPhenotype,
    hpoTranslate,
    hpoData,
    omimTranslate,
    orpha,
    // omimAnnot,
  ] = await Promise.all([
    getHPODisease(resDir),
    getHPOPhenotype(resDir),
    getHPOTranslate(resDir),
    getHPOData(resDir),
    getOMIMTranslate(resDir),
    getORPHA(resDir),
    // getOMIMAnnot(res),
  ]);
  // performance.mark("process_start");
  console.error(`Memory usage: ${fmtBytes(Deno.memoryUsage().heapTotal)}`);

  let header: string[] | null = null,
    idColumns: [number, number, number, number] = [-1, -1, -1, -1],
    GTColumn = -1;
  const dedupeCols = new Set<number>();

  const newColumnsPrepend = {
    ID: "",
  };
  const sampleGTColumns = Object.fromEntries(samples.map((k) => [k, ""]));
  return new TransformStream({
    transform(chunk: string[], controller) {
      if (!header) {
        GTColumn = chunk.indexOf("GEN[*].GT");
        if (GTColumn === -1) {
          throw new Error("Missing required columns: GEN[*].GT");
        }
        // remove gt column
        chunk.splice(GTColumn, 1);
        header = [
          ...Object.keys(newColumnsPrepend),
          ...Object.keys(sampleGTColumns),
          ...chunk,
          ...Object.keys(newColumnsAppend),
        ];
        idColumns = [
          chunk.indexOf("CHROM"),
          chunk.indexOf("POS"),
          chunk.indexOf("REF"),
          chunk.indexOf("ALT"),
        ];
        dedupeFields.forEach((key) => {
          dedupeCols.add(chunk.indexOf(key));
        });
        if (idColumns.some((v) => v === -1)) {
          throw new Error("Missing required columns: CHROM, POS, REF, ALT");
        }

        controller.enqueue(header);
        return;
      }

      const colsPrepend = { ...newColumnsPrepend };
      colsPrepend.ID = idColumns
        .map((i) => chunk[i])
        .join("-")
        .replace(/^chr/, "");
      const GT = chunk[GTColumn].split(",");
      if (GT.length !== samples.length) {
        throw new Error(
          `GT length not match, expected ${samples}(${samples.length}), got ${
            GT.length
          }: ${chunk.join(",")}`
        );
      }
      GT.forEach((v, i) => {
        sampleGTColumns[samples[i]] = GTMap[v] ?? v;
      });
      // remove gt[*] column
      chunk.splice(GTColumn, 1);

      const colsAppend = { ...newColumnsAppend };
      const gene = chunk[header.indexOf("ANN[0].GENE")];
      if (gene && hpoPhenotype[gene]) {
        const ids = hpoPhenotype[gene]!.map((row) => row.hpo_id.substring(3));
        colsAppend.hpo_phenotype = ids.join("|");
        colsAppend.hpo_phenotype_cn = ids
          .map((id) => getHPOPhenotypeName(id))
          .join("|");
        colsAppend.hpo_phenotype_en = ids
          .map((id) => getHPOPhenotypeName(id, false))
          .join("|");
      }
      if (gene && hpoDisease[gene]) {
        const ids = hpoDisease[gene]!.map((row) => row.disease_id);
        colsAppend.hpo_disease = ids.join(",");
        colsAppend.hpo_disease_cn = ids.map((v) => getDisease(v)).join("|");
        colsAppend.hpo_disease_en = ids
          .map((v) => getDisease(v, false))
          .join("|");
      }
      controller.enqueue([
        ...Object.values(colsPrepend),
        ...Object.values(sampleGTColumns),
        ...chunk.map((v, i) => {
          if (dedupeCols.has(i)) {
            v = uniq(v);
          }
          return v.replace(/\\x3b/g, ";");
        }),
        ...Object.values(colsAppend),
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

async function printStdErr(err: ReadableStream<Uint8Array>) {
  for await (const chunk of err) {
    await Deno.stderr.write(chunk);
  }
}
