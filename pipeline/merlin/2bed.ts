import { csvParse, type, mapValues, groupBy, csvStringify } from "@/deps.ts";
import { Threshold } from "./clamp.ts";

const Partbl = type({
  CHR: "string",
  cmPos: ["string", "|>", parseFloat],
  LABEL: [
    "string",
    "|>",
    (data) => {
      const [chr, pos] = data.split(":");
      if (
        !chr?.startsWith("chr") ||
        !pos ||
        !Number.isInteger(+pos) ||
        +pos <= 0
      )
        throw new Error(`Invalid LABEL: ${data}`);
      return { chr: chr.substring(3), pos: +pos };
    },
  ],
  MODEL: "string",
  lod: ["string", "|>", parseFloat],
  alpha: ["string", "|>", parseFloat],
  hlod: ["string", "|>", parseFloat],
});
// deno-lint-ignore no-explicit-any
const partblColumns = Object.keys(Partbl.definition as any);

export async function extractRanges(
  partblFile: string,
  outputBed: string,
  {
    threshold,
    offset,
    minRangeWidth,
    model,
  }: {
    threshold: Threshold;
    offset: number;
    minRangeWidth?: number;
    model?: string;
  }
) {
  const partbl = await Deno.readTextFile(partblFile)
    .then((content) =>
      csvParse(content, {
        skipFirstRow: true,
        separator: "\t",
        columns: partblColumns,
      })
    )
    .then((rows) =>
      rows.map((row, i) => {
        const { data, problems } = Partbl(row);
        if (data) return data;
        throw new Error(`Invalid data at line ${i + 1}: ${problems}`);
      })
    );

  const ranges = mapValues(
    groupBy(partbl, (data) => data.CHR),
    (rows) => {
      if (!rows) throw new Error("No data");
      const data = model ? rows.filter((v) => v.MODEL === model) : rows;
      const indexRanges: [number, number][] = [];
      for (let i = 0; i < data.length; i++) {
        let clampValue = data[i][threshold.field];
        // get the index of first marker that is above the threshold
        // then scan forward until the LOD drops below the threshold and get the index of that marker
        // then add offset to the start and end index, update i to the end index and repeat
        if (clampValue >= threshold.value) {
          const rangeStart = i;
          while (clampValue >= threshold.value && i < data.length - 1) {
            i++;
            clampValue = data[i][threshold.field];
          }
          const rangeEnd = i;
          const start = Math.max(0, rangeStart - offset);
          const end = Math.min(data.length - 1, rangeEnd + offset);
          i = end;
          indexRanges.push([start, end]);
        }
      }
      // handle overlapping ranges
      for (let i = 0; i < indexRanges.length - 1; i++) {
        const range = indexRanges[i];
        const nextRange = indexRanges[i + 1];
        if (range[1] >= nextRange[0]) {
          range[1] = nextRange[1];
          indexRanges.splice(i + 1, 1);
          i--;
        }
      }
      const realRanges = indexRanges.map(
        ([start, end]) => [data[start].LABEL.pos, data[end].LABEL.pos] as const
      );
      if (minRangeWidth !== undefined && minRangeWidth > 0) {
        return realRanges.filter(
          ([start, end]) => end - start >= minRangeWidth
        );
      }
      return realRanges;
    }
  );
  await Deno.writeTextFile(
    outputBed,
    csvStringify(
      Object.entries(ranges).flatMap(([chr, ranges]) =>
        // bed format is 0-based and end-exclusive 
        ranges.map(([start, end]) => [chr, start - 1, end, end - start])
      ),
      {
        crlf: false,
        separator: "\t",
        headers: true,
        columns: ["#chr", "start", "end", "size"],
      }
    )
  );
  console.error(
    `Wrote ${
      Object.values(ranges).flat().length
    } ranges to ${outputBed} with threshold ${threshold.value} by ${
      threshold.field
    }`
  );
}
