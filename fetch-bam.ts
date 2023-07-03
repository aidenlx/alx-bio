import { Command } from "./deps.ts";
import { connectIGV } from "./modules/igv.ts";
import { getBamSegment } from "./modules/remote.ts";

const defaultIgvPort = 60151;
const envPrefix = "RI_" as const;

export default new Command()
  .name("fetch-bam")
  .description("Fetch a segment of a remote BAM file and load into IGV")
  .env(
    `${envPrefix}IGV_PORT=<value:number>`,
    `Port for IGV to connect to (default to ${defaultIgvPort})`,
    { prefix: envPrefix }
  )
  .env(
    `${envPrefix}SSH_DEST=<value:string>`,
    "SSH destination for remote IGV",
    { required: true, prefix: envPrefix }
  )
  .arguments("<inputBam:string> <range:string> [label_name:string]")
  .example(
    "fetch chr1:5000-6000 from /path/to/remote.bam",
    "bio fetch-bam /path/to/remote.bam chr1:5000-6000"
  )
  .example(
    "fetch reads around chr1:60000 (~1000bp by default)",
    "bioa fetch-bam /path/to/remote.bam chr1:60000"
  )
  .example(
    "fetch reads around chr1:60000 (~5000bp)",
    "bioa fetch-bam /path/to/remote.bam chr1:60000^5000"
  )
  .example(
    "fetch reads around chr1:60000 (~50000bp)",
    "bioa fetch-bam /path/to/remote.bam chr1:60000^5e4"
  )
  .action(async (options, _range, inputBam, outputName) => {
    const igvPort = options.igvPort ?? defaultIgvPort;
    if (!Number.isInteger(igvPort) || igvPort < 0 || igvPort > 65535) {
      console.error("Invalid IGV_PORT: " + igvPort);
      Deno.exit(1);
    }
    const igvConn = await connectIGV({ port: igvPort }).catch((error) => {
      if (error instanceof Deno.errors.ConnectionRefused) {
        console.error(
          `Connection to IGV failed, make sure IGV is running ` +
            `and Port ${igvPort} is enabled in View > Preferences > Advanced.` +
            error.message.replace("Connection refused", "")
        );
        Deno.exit(1);
      }
      throw error;
    });
    const { bam, range, cleanup } = await getBamSegment({
      inputBam,
      outputName,
      range: _range,
      sshDest: options.sshDest,
    });
    console.info(
      `Got bam and bam index files within range ${range}, loading into IGV`
    );

    await igvConn.exec(`load ${bam}`);
    await igvConn.exec(`goto ${range}`);

    igvConn.close();
    await cleanup();
  });
