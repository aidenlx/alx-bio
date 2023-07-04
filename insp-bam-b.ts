import { basename } from "https://deno.land/std@0.192.0/path/win32.ts";
import {
  Command,
  envPrefix,
  yamlParse,
  keypress,
  z,
  ValidationError,
  c,
} from "./deps.ts";
import { connectIGV, defaultIgvPort } from "./modules/igv.ts";
import { RegionType, portType } from "./modules/parse.ts";
import { getBamSegment } from "./modules/remote.ts";

const regionParser = new RegionType();
const yamlFormat = z.record(
  z.array(
    z.string().superRefine((value, ctx) => {
      try {
        regionParser.parse({ value });
      } catch (error) {
        if (error instanceof ValidationError) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: error.message,
          });
        } else {
          throw error;
        }
      }
    })
  )
);

export default new Command()
  .name("insp-bam-batch")
  .description("Inspect a list of variant calls in a BAM file")
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
  .arguments("<yamlList:file>")
  .action(async (options, yamlList) => {
    const { sshDest, igvPort } = options;

    const targets = Object.entries(
      await Deno.readTextFile(yamlList)
        .then(yamlParse)
        .then(yamlFormat.parseAsync)
    )
      .flatMap(([inputBam, regions]) =>
        regions.map((value) => ({
          inputBam,
          query: value,
          region: regionParser.parse({ value }),
        }))
      )
      .values();

    const igvConn = await connectIGV({ port: igvPort });

    let target: ReturnType<(typeof targets)["next"]>;
    function next() {
      target = targets.next();
      if (target.done) {
        console.log("All done!");
      } else {
        console.log(
          `
Press enter to inspect ${printQuery(target.value)}, 
${c.gray("ctrl-c")} to exit, 
${c.gray("ctrl-d")} to skip`.replaceAll("\n", "")
        );
      }
      return target.done ? null : target.value;
    }

    let value = next();
    if (value) {
      for await (const event of keypress()) {
        if (event.ctrlKey && event.key === "c") {
          console.log("exit");
          break;
        }
        if (event.ctrlKey && event.key === "d") {
          value = next();
          if (value) continue;
        }
        if (event.key !== "return") {
          console.log(c.yellow("Press enter to continue"));
          continue;
        }
        if (!value) break;
        const { inputBam, region, query } = value;
        console.info(c.blue(`Inspect target: ${query}`));
        console.info(`Fetching bam segment: ${printQuery(value)}`);
        const { bam, cleanup } = await getBamSegment({
          inputBam,
          region,
          sshDest,
        });
        console.info(`Loading into IGV`);
        await igvConn.exec(`load ${bam}`);
        await igvConn.exec(`goto ${region}`);
        await cleanup();
        console.info(`BAM Loaded`);
        value = next();
      }
    }
    igvConn.close();
  });

function printQuery(value: {
  inputBam: string;
  query: string;
  region: string;
}) {
  return [c.yellow(value.query), "@", c.green(basename(value.inputBam))].join(
    ""
  );
}
