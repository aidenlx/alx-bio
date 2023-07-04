import { BufReader, BufWriter } from "../deps.ts";
export const defaultIgvPort = 60151;

export async function connectIGV({
  hostname = "127.0.0.1",
  port = defaultIgvPort,
}: {
  hostname?: string;
  port?: number;
}) {
  const igvConn = await Deno.connect({
    port,
    hostname,
  }).catch((error) => {
    if (error instanceof Deno.errors.ConnectionRefused) {
      console.error(
        `Connection to IGV failed, make sure IGV is running ` +
          `and Port ${port} is enabled in View > Preferences > Advanced.` +
          error.message.replace("Connection refused", "")
      );
      Deno.exit(1);
    }
    throw error;
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
