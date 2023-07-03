import { BufReader, BufWriter } from "../deps.ts";

export async function connectIGV({
  hostname = "127.0.0.1",
  port = 60151,
}: {
  hostname?: string;
  port?: number;
}) {
  const igvConn = await Deno.connect({
    port,
    hostname,
  });
  const writer = new BufWriter(igvConn);
  const reader = new BufReader(igvConn);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  return {
    async exec(command: string): Promise<void> {
      await writer.write(encoder.encode(command + "\n"));
      await writer.flush();

      const response = await reader.readLine();
      const respText = decoder.decode(response?.line);
      if (respText !== "OK") {
        throw new Error(`Error for "${command}": ${respText}`);
      } else {
        return;
      }
    },
    close() {
      igvConn.close();
    },
  };
}
