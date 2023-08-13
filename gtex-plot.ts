import type { ProtocolMapping } from "npm:devtools-protocol@0.0.1170846/types/protocol-mapping.d.ts";

import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v1.0.0-rc.2/command/mod.ts";
import { prepareSVG } from "./modules/render-gtex.js";

// @deno-types="npm:puppeteer@20.8.2"
import puppeteer, {
  TimeoutError,
  type Browser,
  type Connection,
  type ProductLauncher,
} from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { ValidationError, ensureDir, join, pLimit, type } from "./deps.ts";

const plotType = [
  "gene-expr-vplot",
  "single-cell-expr-vplot",
  // "gene-transcript-browser-svg-div",
] as const;
type PlotType = (typeof plotType)[number];

export default new Command()
  .name("gtex-plot")
  .type("parallel", ({ label, name, value }) => {
    const { data, problems } = type("integer>0")(value);
    if (data === undefined)
      throw new ValidationError(
        `[${label}]: expected "${name}" positive integer, got ${value}: ` +
          problems
      );
    if (data > navigator.hardwareConcurrency) {
      console.warn(
        "Warning: Parallelism is greater than number of cores " +
          navigator.hardwareConcurrency
      );
    }
    return data;
  })
  .type("plot-type", new EnumType(plotType))
  .option("-o, --out <dir:string>", "Output directory", {
    default: "gtex-plot",
  })
  .option("-t, --type [type...:plot-type]", "Plot type", {
    default: ["gene-expr-vplot"] as PlotType[],
  })
  .option("-p, --parallel <n:parallel>", "Number of parallel downloads", {
    default: navigator.hardwareConcurrency,
  })
  .option("--executable-path <path:string>", "Path to chrome executable")
  .arguments("[...genes:string]")
  .action(async (opts, ...inputGenes) => {
    const limit = pLimit(opts.parallel);
    let executablePath: string;
    if (opts.executablePath) {
      executablePath = opts.executablePath;
    } else if (Deno.build.os === "darwin") {
      executablePath =
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    } else {
      throw new Error("Must specify --executable-path");
    }
    const browser = await (puppeteer.launch as ProductLauncher["launch"])({
      executablePath,
      // args: ["--disable-web-security"],
    });
    await ensureDir(opts.out);
    const types = opts.type as PlotType[];

    const downloadGraph = getDlGraphFn(browser, opts.out);
    const genes = new Set(inputGenes);
    console.log(`genes: ${[...genes]}, type: ${types}`);
    const existing = new Set<string>();
    for await (const i of Deno.readDir(opts.out)) {
      if (i.isDirectory) continue;
      if (i.name.endsWith(".svg")) {
        existing.add(i.name);
      }
    }
    const tasks = [...genes].map((gene) =>
      limit(() =>
        downloadGraph(
          gene,
          types.filter((t) => !existing.has(toOutputName(gene, t)))
        ).catch(console.error)
      )
    );
    await Promise.all(tasks);
    console.log("All Done");
    await browser.close();
  });

function toOutputName(gene: string, plotType: PlotType) {
  return `${gene}.${plotType}.svg`;
}

function getDlGraphFn(browser: Browser, outDir: string) {
  return async function downloadGraph(gene: string, types: PlotType[]) {
    if (types.length === 0) {
      console.info(`Skipping ${gene}`);
      return;
    } else {
      console.info(`Downloading ${types.join(", ")}@${gene}`);
    }
    const page = await browser.newPage();
    try {
      await page.setBypassCSP(true);

      await page.goto(`https://gtexportal.org/home/gene/${gene}`);

      const geneSearchOk = await new Promise<boolean>((resolve) => {
        page.on("response", async (response) => {
          const request = response.request();
          const url = request.url();
          if (!url.includes("/api/v2/reference/geneSearch?")) return;
          if (!response.ok) {
            resolve(false);
            return;
          }
          const query = await response.json();
          resolve(query.paging_info.numberOfPages > 0);
        });
      });

      if (!geneSearchOk) {
        throw new Deno.errors.NotFound("Gene not found " + gene);
      }

      for (const plotType of types) {
        const el = await page.waitForSelector(`#${plotType}-svg`, {
          visible: true,
          timeout: 30e3,
        });
        if (!el) throw new Error("Graph not found");
        console.log(`Graph loaded ${plotType}@${gene}`);
        const svg = await el.evaluate(prepareSVG);
        await Deno.writeTextFile(
          join(outDir, toOutputName(gene, plotType)),
          svg
        );
        console.log(`Saved ${plotType}@${gene}`);
      }
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error(
          `Timeout downloading ${gene}, check if graph exists here: https://gtexportal.org/home/gene/${gene}`
        );
        return;
      }
      if (error instanceof Deno.errors.NotFound) {
        console.error(
          `Gene not found ${gene}, https://gtexportal.org/home/gene/${gene}`
        );
        return;
      }
      console.error(`Error downloading ${gene}`, error);
    } finally {
      await page.close();
    }
  };
}

interface CDPSession extends EventEmitter {
  /* Excluded from this release type: __constructor */
  connection(): Connection | undefined;
  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]["paramsType"]
  ): Promise<ProtocolMapping.Commands[T]["returnType"]>;
  on<T extends keyof ProtocolMapping.Events>(
    eventName: T,
    listener: (...eventArgs: ProtocolMapping.Events[T]) => void
  ): this;
  once<T extends keyof ProtocolMapping.Events>(
    eventName: T,
    listener: (...eventArgs: ProtocolMapping.Events[T]) => void
  ): this;
  /**
   * Detaches the cdpSession from the target. Once detached, the cdpSession object
   * won't emit any events and can't be used to send messages.
   */
  detach(): Promise<void>;
  /**
   * Returns the session's id.
   */
  id(): string;
}
