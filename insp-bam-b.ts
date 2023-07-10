import {
  Command,
  envPrefix,
  yamlParse,
  keypress,
  z,
  ValidationError,
  c,
  basename,
  join,
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

    // Check if IGV is running
    await connectIGV({ port: igvPort }).then((i) => i.close());

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

    console.clear();
    // deno-lint-ignore prefer-const
    let values: {
      prev: IteratorResult<{
        inputBam: string;
        query: string;
        region: string;
      }> | null;
      curr: IteratorResult<{
        inputBam: string;
        query: string;
        region: string;
      }>;
    } = {
      prev: null,
      curr: targets.next(),
    };
    function goNext() {
      values.prev = values.curr;
      values.curr = targets.next();
    }
    promptForNextQuery(values.curr);
    if (values.curr.done) return;

    for await (const event of keypress()) {
      if (event.ctrlKey && event.key === "c") {
        console.log("exit");
        break;
      }
      if (event.ctrlKey && event.key === "d") {
        goNext();
        promptForNextQuery(values.curr);
        if (!values.curr.done) continue;
        else break;
      }
      if (event.ctrlKey && event.key === "s") {
        const { prev } = values;
        if (!prev || prev.done) {
          console.log(c.yellow("No target to take snapshot"));
          continue;
        }
        const { inputBam, query } = prev.value;
        const sample = basename(inputBam).split(".")[0];
        const saveto = `${sample}-${query}.png`;
        await connectIGV({ port: igvPort }).then((i) =>
          i.exec(`snapshot ${join(Deno.cwd(), saveto)}`)
        );
        console.clear();
        console.log(`Snapshot saved to ${saveto}`);
        promptForNextQuery(values.curr);
        continue;
      }
      if (event.key !== "return") {
        promptForNextQuery(values.curr);
        continue;
      }
      goNext();
      if (values.curr.done) break;
      const { inputBam, region } = values.curr.value;
      console.info(`Fetching bam segment`);
      const { bam, cleanup } = await getBamSegment({
        inputBam,
        region,
        sshDest,
      });
      console.info(`Loading into IGV`);
      await connectIGV({ port: igvPort }).then((i) =>
        i.exec(`load ${bam}`, `goto ${region}`)
      );
      await cleanup();
      console.clear();
      const prettyQuery = printQuery(values.curr.value);
      console.log(`Loaded ${prettyQuery}`);
      promptForNextQuery(values.curr);
    }
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

function promptForNextQuery(
  value: IteratorResult<{
    inputBam: string;
    query: string;
    region: string;
  }>
) {
  if (value.done) {
    console.log("All done!");
    return;
  }
  console.log(
    `
Press enter to inspect ${printQuery(value.value)}, 
${c.gray("ctrl-c")} to exit, 
${c.gray("ctrl-d")} to skip, 
${c.gray("ctrl-s")} to take snapshot of current view
`.replaceAll("\n", "")
  );
}
