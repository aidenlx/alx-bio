import { Command, CsvParseStream, CsvStringifyStream } from "@/deps.ts";
import { freqSource } from "@/pipeline/_freq.ts";

export default new Command()
  .name("tsv.filter")
  .option("-f, --freq <threshold:number>", "filter by frequency", {
    required: true,
  })
  .action(async ({ freq: threshold }) => {
    let _header: string[] | undefined;
    const freq = freqSource.global.concat(freqSource.eas);

    await Deno.stdin.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new CsvParseStream({ skipFirstRow: false, separator: "\t" }))
      .pipeThrough(
        new TransformStream({
          transform(row, controller) {
            if (!_header) {
              _header = row;
              controller.enqueue(row);
              return;
            }
            const header = _header;
            const exceedThreshold = (col: string) => {
              const data = row[header.indexOf(col)];
              return data && Number.parseFloat(data) >= threshold;
            };
            if (freq.some(exceedThreshold)) return;

            controller.enqueue(row);
          },
        })
      )
      .pipeThrough(new CsvStringifyStream({ separator: "\t", crlf: false }))
      .pipeThrough(new TextEncoderStream())
      .pipeTo(Deno.stdout.writable);
  });
