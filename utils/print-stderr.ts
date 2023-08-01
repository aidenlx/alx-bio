export default async function printStderr(err: ReadableStream<Uint8Array>) {
  for await (const chunk of err) {
    await Deno.stderr.write(chunk);
  }
}
