import { Command } from "./deps.ts";
import { connectIGV, defaultIgvPort } from "./modules/igv.ts";
import { RangeType, portType } from "./modules/parse.ts";
import { getBamSegment } from "./modules/remote.ts";

const envPrefix = "RI_" as const;

export default new Command()
  .name("fetch-bam")
  .description("Fetch a segment of a remote BAM file and load into IGV")
  .type("range", new RangeType())
  .type("port", portType)
  .env(
    `${envPrefix}IGV_PORT=<value:port>`,
    `Port for IGV to connect to (default to ${defaultIgvPort})`,
    { prefix: envPrefix }
  )
  .env(
    `${envPrefix}SSH_DEST=<value:string>`,
    "SSH destination for remote IGV",
    { required: true, prefix: envPrefix }
  )
  .option("-r, --range <range:range>", "Range to fetch", { required: true })
  .option("-l, --label <name:string>", "label of the track")
  .arguments("<inputBam:string>")
  .example(
    "fetch chr1:5000-6000 from /path/to/remote.bam",
    "bio fetch-bam /path/to/remote.bam -r chr1:5000-6000"
  )
  .example(
    "fetch around chr1:60000 (~1000bp by default) with label 'mine'",
    "bioa fetch-bam /path/to/remote.bam -r chr1:60000 -l mine"
  )
  .example(
    "fetch around chr1:60000 (~5000bp)",
    "bioa fetch-bam /path/to/remote.bam -r chr1:60000^5000"
  )
  .example(
    "fetch around chr1:60000 (~50000bp)",
    "bioa fetch-bam /path/to/remote.bam -r chr1:60000^5e4"
  )
  .action(async (options, inputBam) => {
    const { label, range, sshDest, igvPort } = options;

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
    console.info(`Getting bam segment: ${range}`);
    const { bam, cleanup } = await getBamSegment({
      inputBam,
      outputName: label,
      range,
      sshDest,
    });
    console.info(
      `Got bam and bam index files within range ${range}, loading into IGV`
    );

    await igvConn.exec(`load ${bam}`);
    await igvConn.exec(`goto ${range}`);

    igvConn.close();
    await cleanup();
  });
