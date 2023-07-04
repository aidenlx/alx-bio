import { Command } from "./deps.ts";
import { connectIGV, defaultIgvPort } from "./modules/igv.ts";
import { RegionType, portType } from "./modules/parse.ts";
import { getBamSegment } from "./modules/remote.ts";

const envPrefix = "RI_" as const;

export default new Command()
  .name("insp-bam")
  .description("Inspect a remote BAM file in IGV within given region")
  .type("region", new RegionType())
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
  .option("-r, --region <region:region>", "Region to fetch", { required: true })
  .option("-l, --label <name:string>", "label of the track")
  .arguments("<inputBam:string>")
  .example(
    "fetch chr1:5000-6000 from /path/to/remote.bam",
    "bio insp-bam /path/to/remote.bam -r chr1:5000-6000"
  )
  .example(
    "fetch around chr1:60000 (~1000bp by default) with label 'mine'",
    "bioa insp-bam /path/to/remote.bam -r chr1:60000 -l mine"
  )
  .example(
    "fetch around chr1:60000 (~5000bp)",
    "bioa insp-bam /path/to/remote.bam -r chr1:60000^5000"
  )
  .example(
    "fetch around chr1:60000 (~50000bp)",
    "bioa insp-bam /path/to/remote.bam -r chr1:60000^5e4"
  )
  .action(async (options, inputBam) => {
    const { label, region, sshDest, igvPort } = options;

    const igvConn = await connectIGV({ port: igvPort });
    console.info(`Getting bam segment: ${region}`);
    const { bam, cleanup } = await getBamSegment({
      inputBam,
      outputName: label,
      region,
      sshDest,
    });
    console.info(
      `Got bam and bam index files within region ${region}, loading into IGV`
    );

    await igvConn.exec(`load ${bam}`);
    await igvConn.exec(`goto ${region}`);

    igvConn.close();
    await cleanup();
  });
