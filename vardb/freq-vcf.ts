import { Redis, connect } from "https://deno.land/x/redis@v0.31.0/mod.ts";
import { readableStreamFromIterable } from "https://deno.land/std@0.194.0/streams/mod.ts";
import { CsvStringifyStream, formatDate } from "@/deps.ts";
import { localAC, localAF } from "@/pipeline/_res.ts";
import getChrList from "@/utils/chr.ts";
const redis = await connect({
  hostname: "127.0.0.1",
  port: 6379,
});

const totalAlleleCount = await redis.scard("resource:urls");

const vcfColumns = [
  "#CHROM",
  "POS",
  "ID",
  "REF",
  "ALT",
  "QUAL",
  "FILTER",
  "INFO",
  // "FORMAT",
];

console.log(`##fileformat=VCFv4.2
##fileDate=${formatDate(new Date(), "yyyyMMdd")}
##INFO=<ID=${localAF},Number=A,Type=Float,Description="Local Allele Frequency">
##INFO=<ID=${localAC},Number=A,Type=Integer,Description="Local Allele Count">`);

await readableStreamFromIterable(getAllAlleleCount(redis))
  .pipeThrough(
    new TransformStream({
      transform([chr, pos, ref, alt, alleleCount], controller) {
        controller.enqueue({
          "#CHROM": chr,
          POS: pos,
          ID: `${chr}-${pos}-${ref}-${alt}`,
          REF: ref,
          ALT: alt,
          QUAL: ".",
          FILTER: ".",
          INFO: `${localAC}=${alleleCount};${localAF}=${
            alleleCount / totalAlleleCount
          }`,
        });
      },
    })
  )
  .pipeThrough(
    new CsvStringifyStream({
      columns: vcfColumns,
      crlf: false,
      separator: "\t",
    })
  )
  .pipeThrough(new TextEncoderStream())
  .pipeTo(Deno.stdout.writable);

// async iterator using redis hscan
// async function* scanAlleleCount(
//   redis: Redis,
//   options: {
//     pattern?: string;
//     count?: number;
//   } = {}
// ) {
//   for (const c of chr) {
//     console.error(`Scanning chr${c}...`);
//     let cursor = 0;
//     do {
//       const [nextCursor, snpIds] = await redis.hscan(
//         `snp:allele.count:chr${c}`,
//         cursor,
//         options
//       );
//       cursor = Number(nextCursor);
//       // yield every two elements
//       for (let i = 0; i < snpIds.length; i += 2) {
//         yield [snpIds[i], Number.parseInt(snpIds[i + 1], 10)] as const;
//       }
//     } while (cursor !== 0);
//   }
//   console.error("All done!");
// }

async function* getAllAlleleCount(redis: Redis) {
  for (const c of getChrList(true)) {
    console.error(`getall chr${c}...`);
    // yield every two elements
    yield* [
      ...everyAllelCount(await redis.hgetall(`snp:allele.count:${c}`)),
    ].sort(([, a], [, b]) => a - b);
  }
  console.error("All done!");
}

function* everyAllelCount(data: string[]) {
  for (let i = 0; i < data.length; i += 2) {
    const [chr, pos, ref, alt] = data[i].split("-");
    yield [
      chr,
      Number.parseInt(pos),
      ref,
      alt,
      Number.parseInt(data[i + 1], 10),
    ] as const;
  }
}
