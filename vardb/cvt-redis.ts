import { TextLineStream } from "https://deno.land/std@0.194.0/streams/mod.ts";

import { Redis, connect } from "https://deno.land/x/redis@v0.31.0/mod.ts";

import { toFileUrl } from "https://deno.land/std@0.194.0/path/mod.ts";
import { globby as glob } from "npm:globby";

import { join } from "https://deno.land/std@0.194.0/path/mod.ts";

if (!Deno.args[0]) {
  console.info(`Usage: ${Deno.execPath()} <vcfRootDir>`);
  Deno.exit(1);
}

console.log("Searching in " + Deno.args[0]);
const toImport = await glob(join("**", "*.snv.hs37.txt"), {
  cwd: Deno.args[0],
  absolute: true,
  onlyFiles: true,
});
console.info(`found ${toImport.length} files to import`);

import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";
import { basename, dirname } from "https://deno.land/std@0.194.0/path/win32.ts";

const redis = await connect({
  hostname: "127.0.0.1",
  port: 6379,
});

const progress = new ProgressBar({
  title: "Importing SNP...",
  total: toImport.length,
  display: ":bar :text :percent :time :eta :completed/:total",
});
let completed = 0;
for (const snvTxtGz of toImport) {
  await ExtractAndHpoAnnot(redis, snvTxtGz, "lab-pi");
  progress.render(completed++);
}

console.info("Import done, saving...");
console.log(await redis.save());
console.info("All Done");

// Generating Redis Protocol
// https://redis.io/topics/protocol
function generateRedisProtocol(command: string, ...args: string[]) {
  const protocol = ["*" + (args.length + 1), "$" + command.length, command];
  for (const arg of args) {
    protocol.push("$" + arg.length, arg);
  }
  return protocol.join("\r\n") + "\r\n";
}

async function ExtractAndHpoAnnot(
  redis: Redis,
  inputSnvTxtGz: string,
  source: "lab-admin" | "lab-pi"
) {
  // const query = "%CHROM-%POS-%REF-%ALT\\n";

  // const extractFields = new Deno.Command("bcftools", {
  //   args: ["query", "-f", query, "-i", 'TYPE="snp"', inputVcf],
  //   stdin: "null",
  //   stdout: "piped",
  //   stderr: "piped",
  // }).spawn();
  // printStderr(extractFields.stderr);

  // const stockId = basename(inputVcf).split(".").at(0)!;

  // const [hash] = (await $`zcat < ${inputVcf} | md5sum`).stdout.split(" ");

  const prefix = basename(inputSnvTxtGz).split(".").at(0)!;
  const [rawVcf] = await glob(`${prefix}*.raw.{hs37.vcf,vcf}`, {
    cwd: dirname(inputSnvTxtGz),
    absolute: true,
    onlyFiles: true,
  });

  if (!rawVcf) {
    progress.console(`!! rawVcf not found: ${rawVcf}`);
    return;
  }

  const inputFileUrl = toFileUrl(rawVcf)
    .toString()
    .replace("file:///", `file://${source}/`);

  const isFileCached = await redis.sismember("resource:urls", inputFileUrl);
  if (isFileCached) {
    progress.console(`File ${inputSnvTxtGz} is already cached`);
    return;
  }
  const fileId = await redis.incr("resource:id");

  progress.console(`Importing ${inputSnvTxtGz}...`);

  const redisCli = new Deno.Command("redis-cli", {
    args: ["--pipe"],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  async function print(err: ReadableStream<Uint8Array>) {
    for await (const chunk of err) {
      progress.console(new TextDecoder().decode(chunk));
    }
  }
  print(redisCli.stdout);
  print(redisCli.stderr);

  const input = await Deno.open(inputSnvTxtGz);

  await input.readable
    // .pipeThrough(new DecompressionStream("gzip"))
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream({ allowCR: true }))
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const snpId = chunk.trim().replace(/^chr/, "");
          controller.enqueue(
            generateRedisProtocol(
              "SADD",
              `snp:variant:hg19:${snpId}:src`,
              fileId.toString()
            )
          );
          const [chr, pos] = snpId.replace(/^chr/, "").split("-");
          controller.enqueue(
            generateRedisProtocol(
              "ZADD",
              `snp:position:hg19:chr${chr}`,
              pos,
              snpId
            )
          );
        },
      })
    )
    .pipeThrough(new TextEncoderStream())
    .pipeTo(redisCli.stdin);

  const p = redis.pipeline();
  p.sadd("resource:urls", inputFileUrl);
  p.hset(`resource:details:${fileId}`, ["url", inputFileUrl], ["type", "vcf"]);
  await p.flush();
}
