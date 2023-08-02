import { CsvParseStream } from "@/deps.ts";

// const redisCli = new Deno.Command("redis-cli", {
//   args: ["--pipe"],
//   stdin: "piped",
//   stdout: "piped",
//   stderr: "piped",
// }).spawn();
// async function print(err: ReadableStream<Uint8Array>) {
//   for await (const chunk of err) {
//     console.error(new TextDecoder().decode(chunk));
//   }
// }
// print(redisCli.stdout);
// print(redisCli.stderr);

await Deno.stdin.readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new CsvParseStream({ separator: "\t", skipFirstRow: false }))
  .pipeThrough(
    new TransformStream({
      transform([snpId, ...genes], controller) {
        [...new Set(genes)].forEach((gene, i) => {
          controller.enqueue(
            generateRedisProtocol(
              "ZADD",
              `snp:gene:hg19:${gene}`,
              `${i + 1}`,
              snpId.replace(/^chr/, "")
            )
          );
        });
      },
    })
  )
  .pipeThrough(new TextEncoderStream())
  .pipeTo(Deno.stdout.writable);

// Generating Redis Protocol
// https://redis.io/topics/protocol
function generateRedisProtocol(command: string, ...args: string[]) {
  const protocol = ["*" + (args.length + 1), "$" + command.length, command];
  for (const arg of args) {
    protocol.push("$" + arg.length, arg);
  }
  return protocol.join("\r\n") + "\r\n";
}
