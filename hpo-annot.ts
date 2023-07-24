import getHPODisease from "./database/hpo-disease.ts";
import getHPOPhenotype from "./database/hpo-phenotype.ts";
import getHPOTranslate from "./database/hpo-cn.ts";
import { CsvStringifyStream, CsvParseStream, fmtBytes } from "./deps.ts";
// import getOMIMAnnot from "./database/omim-annot.ts";
import getORPHA from "./database/orpha.ts";
import getOMIMTranslate from "./database/omim-cn.ts";
import getHPOData from "./database/hpo-name.ts";
import { Command, fmtDuration } from "./deps.ts";

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

await new Command()
  .name("vcf.annot.post")
  .version("0.1.0")
  .option("-s, --sample <name...:string>", "Sample names", { required: true })
  .option("-i, --input <file:string>", "Input file", { default: "-" })
  .option("-o, --output <file:string>", "Output file", { default: "-" })
  .option("--resource <dir:string>", "Path to Resource", {
    default: "/genetics/home/stu_liujiyuan/alx-bio/deno-csv/res/",
  })
  .action(async ({ input, output, resource: res, sample }) => {
    console.error(`input: ${input}`);
    console.error(`output: ${output}`);
    console.error(`sample: ${sample.join(",")}`);
    const [
      hpoDisease,
      hpoPhenotype,
      hpoTranslate,
      hpoData,
      omimTranslate,
      orpha,
      // omimAnnot,
    ] = await Promise.all([
      getHPODisease(res),
      getHPOPhenotype(res),
      getHPOTranslate(res),
      getHPOData(res),
      getOMIMTranslate(res),
      getORPHA(res),
      // getOMIMAnnot(res),
    ]);
    performance.mark("process_start");
    console.error(`Memory usage: ${fmtBytes(Deno.memoryUsage().heapTotal)}`);

    let header: string[] | null = null,
      idColumns: [number, number, number, number] = [-1, -1, -1, -1],
      GTColumn = -1;
    const dedupeCols = new Set<number>();

    const newColumnsPrepend = {
      ID: "",
    };
    const sampleGTColumns = Object.fromEntries(sample.map((k) => [k, ""]));

    await (input === "-" ? Deno.stdin : await Deno.open(input)).readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new CsvParseStream({
          skipFirstRow: false,
          separator,
        })
      )
      .pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
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
                throw new Error(
                  "Missing required columns: CHROM, POS, REF, ALT"
                );
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
            if (GT.length !== sample.length) {
              throw new Error(
                `GT length not match, expected ${sample}(${
                  sample.length
                }), got ${GT.length}: ${chunk.join(",")}`
              );
            }
            GT.forEach((v, i) => {
              sampleGTColumns[sample[i]] = GTMap[v] ?? v;
            });
            // remove gt[*] column
            chunk.splice(GTColumn, 1);

            const colsAppend = { ...newColumnsAppend };
            const gene = chunk[header.indexOf("ANN[0].GENE")];
            if (gene && hpoPhenotype[gene]) {
              const ids = hpoPhenotype[gene]!.map((row) =>
                row.hpo_id.substring(3)
              );
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
              colsAppend.hpo_disease_cn = ids
                .map((v) => getDisease(v))
                .join("|");
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
        })
      )
      .pipeThrough(new CsvStringifyStream({ separator, crlf: false }))
      .pipeThrough(new TextEncoderStream())
      .pipeTo(
        (output === "-"
          ? Deno.stdout
          : await Deno.open(output, { write: true, create: true })
        ).writable
      );

    console.error(
      `process done, took ${fmtDuration(
        performance.measure("process", "process_start").duration
      )}`
    );
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
        (cn ? hpoTranslate[id]?.name_cn : null) ??
        hpoData[id]?.name ??
        `HP:${id}`
      );
    }
  })
  .parse(Deno.args);
