import { Command, CsvParseStream, CsvStringifyStream } from "@/deps.ts";

const freq = {
  global: [
    "gnomad_e211_AF",
    "gnomad_g211_AF",
    "_1000Gp3_AF",
    "ExAC_AF",
    "ALFA_Total_AF",
  ],
  eas: [
    "gnomad_e211_AF_eas",
    "gnomad_g211_AF_eas",
    "WBBC_AF",
    "WBBC_South_AF",
    "_1000Gp3_EAS_AF",
    "ExAC_EAS_AF",
    "ALFA_East_Asian_AF",
  ],
};

export default new Command()
  .name("tsv.filter")
  .option("-f, --freq <threshold:number>", "filter by frequency", {
    required: true,
  })
  .action(async ({ freq: threshold }) => {
    let _header: string[] | undefined;
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
            if (
              freq.global.some(exceedThreshold) ||
              freq.eas.some(exceedThreshold)
            ) {
              return;
            }
            controller.enqueue(row);
          },
        })
      )
      .pipeThrough(new CsvStringifyStream({ separator: "\t", crlf: false }))
      .pipeThrough(new TextEncoderStream())
      .pipeTo(Deno.stdout.writable);
  });
