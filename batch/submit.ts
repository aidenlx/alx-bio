import {
  $,
  Command,
  Confirm,
  csvParse,
  dirname,
  EnumType,
  exists,
  formatDate,
  join,
  Number as NumberType,
} from "@/deps.ts";
import type { ProcessOutput, ProcessPromise } from "@/deps.ts";
import { genomeAssembly, vcfCaller } from "@/modules/common.ts";
const commonOptions = [
  "--parsable",
  "--output",
  "log-%A-%x_%a.out",
  "--error",
  "log-%A-%x_%a.err",
];

const defaultArrayLimit = 4;

const currTime = formatDate(new Date(), "M-d-HHmm");

const script = (file: string) =>
  join(Deno.env.get("HOME") ?? ".", "alx-bio", "scripts", "array", file);

const toJobId = (resp: ProcessOutput) => {
  if (resp.exitCode !== 0) {
    throw new Error("Job submission failed: " + resp.stderr);
  }
  return Number.parseInt(resp.stdout.trim(), 10);
};

export default new Command()
  .name("pl.submit")
  .description("Pipeline batch submission helper")
  .option("-a, --array <array:string>", "job array index values")
  .option("--dependency <deps:string>", "job dependency")
  .option("-p, --partition <partition:string>", "partition")
  .option("--exclude <exclude:string>", "exclude nodes")
  .type("genomeAssembly", genomeAssembly)
  .type("method", new EnumType(["wes", "wgs"]))
  .option("--parsable", "parsable output")
  .option("-J, --job-name <jobName:string>", "job name", {
    default: currTime,
  })
  .type("vcfCaller", vcfCaller)
  .option("--caller <vcf_caller:vcfCaller>", "variant caller", {
    default: "gatk" as const,
  })
  .option("-m, --method <type:method>", "method", { required: true })
  .option("-r, --ref <ref:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option(
    "--no-cadd-script",
    "use prescored CADD score in favor of CADD script",
  )
  .option("-b, --bait-intervals <path:file>", "bait intervals BED file")
  .option("--target-intervals <path:file>", "target intervals BED file")
  .option("--pick <task_range:string>", "pick tasks to run")
  .option("--no-cleanup", "do not clean up intermediate files")
  .arguments("<array_file:file>")
  .action(async (opts, arrayFile) => {
    const job = (name: string) => ["-J", `${opts.jobName}-${name}`];
    const useCADDScript = opts.caddScript;
    if (!(await exists(arrayFile, { isReadable: true, isFile: true }))) {
      throw new Error(
        "Array file does not exist or is not readable: " + arrayFile,
      );
    }

    console.error(`Reading array file: ${arrayFile}`);
    const list = await Deno.readTextFile(arrayFile).then((c) =>
      csvParse(c, { separator: "\t" })
    );
    list.forEach(([lineNum], i) => {
      if (lineNum !== String(i + 1)) {
        throw new Error(`Array index not match at line ${i + 1}: ${arrayFile}`);
      }
    });
    const lineCount = list.length;

    let array = `1-${lineCount}%${defaultArrayLimit}`;
    if (opts.array) {
      if (opts.array.startsWith("%")) {
        array = `1-${lineCount}` + opts.array;
      } else if (opts.array.includes("%")) {
        array = opts.array;
      } else {
        // apply default array limit
        array = `${opts.array}%${defaultArrayLimit}`;
      }
    }
    console.error(`Array file line count: ${lineCount}`);
    console.error(`Array index: ${array}`);

    const slurmOpts = [
      ...commonOptions,
      ...["-a", array],
      ...(opts.partition ? ["-p", opts.partition] : []),
      ...(opts.exclude ? ["--exclude", opts.exclude] : []),
    ];

    let baitOption: string[] = [],
      targetOption: string[] = [];
    if (opts.method === "wes") {
      if (opts.baitIntervals) {
        baitOption = ["--bait-intervals", opts.baitIntervals];
      }
      if (opts.targetIntervals) {
        targetOption = ["--target-intervals", opts.targetIntervals];
      }
    } else if (opts.method === "wgs") {
      baitOption = ["--wgs-parallel"];
    }

    const cleanup = opts.cleanup ? "" : "--no-cleanup";

    const ref_call = opts.ref === "hg19" ? "hs37" : opts.ref;
    const ref_annot = opts.ref;

    const TaskList = {
      align: () => ({
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-align.slurm",
            )
          } ${arrayFile} ${ref_call} ${cleanup}`,
      }),
      markdup: () => ({
        deps: "align",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-markdup.slurm",
            )
          } ${arrayFile} ${ref_call} --no-cleanup`,
      }),
      markdup_post: () => ({
        deps: "markdup",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-markdup-post.slurm",
            )
          } ${arrayFile} ${ref_call} ${cleanup}`,
      }),
      hs_stat: () => ({
        deps: "markdup_post",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-hs-stat.slurm",
            )
          } ${arrayFile} ${ref_call} ${baitOption} ${targetOption}`,
        canRun: opts.method === "wes",
      }),
      bam: () => ({
        deps: "markdup_post",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-bam.slurm",
            )
          } ${arrayFile} ${ref_call} ${opts.method} ${cleanup} ${baitOption}`,
      }),
      vcf: () => ({
        deps: "bam",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-vcf.slurm",
            )
          } ${arrayFile} ${ref_call} ${opts.method} ${cleanup} ${baitOption}`,
      }),
      // eh: () => ({
      //   deps: "bam",
      //   run: (name, deps) =>
      //     $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
      //       "expansionhunter.slurm"
      //     )} ${arrayFile} ${ref_annot}`,
      // }),
      merge: () => ({
        deps: "vcf",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-merge.slurm",
            )
          } ${arrayFile} ${ref_call}`,
      }),
      gt_gvcf: () => ({
        deps: "merge",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-gt-gvcf.slurm",
            )
          } ${arrayFile} ${ref_call}`,
      }),
      // automap: () => ({
      //   deps: "merge",
      //   run: (name, deps) =>
      //     $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
      //       "automap.slurm"
      //     )} ${arrayFile} ${ref_annot}`,
      // }),
      cadd: () => ({
        deps: "gt_gvcf",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "cadd.slurm",
            )
          } ${arrayFile} ${ref_annot}`,
        canRun: useCADDScript,
      }),
      annot_s: () => ({
        deps: "gt_gvcf",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-annot-s.slurm",
            )
          } ${arrayFile} ${ref_annot}`,
      }),
      annot_m: () => ({
        deps: "annot_s",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-annot-m.slurm",
            )
          } ${arrayFile} ${ref_annot} ${useCADDScript ? "--no-cadd" : ""}`,
      }),
      final: () => ({
        deps: ["cadd", "annot_m"],
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${
            script(
              "snv-final.slurm",
            )
          } ${arrayFile} ${ref_annot} ${
            !useCADDScript ? "--no-cadd-script" : ""
          } --caller ${opts.caller}`,
      }),
    } satisfies Record<string, Task>;

    function parsePick(pick: string | undefined) {
      const tasks = Object.values(TaskList);
      if (!pick) return tasks;
      function parseRange(range: string) {
        const [start, end] = range.split("-"),
          startTask = start
            ? TaskList[start as keyof typeof TaskList]
            : tasks.at(0),
          endTask = end ? TaskList[end as keyof typeof TaskList] : tasks.at(-1);
        if (!startTask) {
          throw new Error(`Begin Task not found for range ${range}: ${start}`);
        }
        if (!endTask) {
          throw new Error(`End Task not found for range ${range}: ${end}`);
        }
        return tasks.slice(
          tasks.indexOf(startTask),
          tasks.indexOf(endTask) + 1,
        );
      }
      return pick.split(",").flatMap((arg) => {
        if (pick.split("-").length === 2) {
          return parseRange(arg);
        }
        const task = TaskList[arg as keyof typeof TaskList];
        if (!task) {
          throw new Error("Task not found: " + arg);
        }
        return [task];
      });
    }

    const taskList = parsePick(opts.pick);

    const jobIds = (await pipe(opts.dependency, ...taskList)).filter(
      (i) => i > 0,
    );
    if (opts.parsable) {
      jobIds.forEach((id) => console.log(id));
    } else {
      console.log("Submitted jobs: " + jobIds.join(" "));
    }

    await Deno.writeTextFile(
      join(dirname(arrayFile), `job-${currTime}.txt`),
      jobIds.join("\n"),
    );
  });

type Task = () => {
  run: (name: string, depArgs: string[]) => ProcessPromise;
  deps?: string[] | string;
  canRun?: boolean;
};

async function pipe(initDep: string | undefined, ...steps: Task[]) {
  const tasks = new Tasks();

  let firstRequestedDeps: string[] | undefined;
  async function getDepArgs(depNames: string[]): Promise<string[]> {
    if (!firstRequestedDeps && initDep) {
      return ["--dependency", initDep];
    } else if (firstRequestedDeps && depNames.length > 0) {
      const frDeps = firstRequestedDeps;
      const taskIds = await tasks.getLots(
        ...depNames.filter((n) => !frDeps.includes(n)),
      );
      const deps: string[] = [];
      if (taskIds.length > 0) {
        deps.push(`aftercorr:${taskIds.join(":")}`);
      }
      if (initDep && taskIds.length < depNames.length) {
        // has same deps as first requested deps
        deps.push(initDep);
      }
      if (deps.length > 0) return ["--dependency", deps.join(",")];
    }
    return [];
  }
  for (const step of steps) {
    const { deps: _deps, run, canRun } = step();
    if (canRun === false) {
      console.error("Skip task: " + step.name);
      tasks.set(step.name, -1);
      continue;
    }
    const deps = !_deps ? [] : typeof _deps === "string" ? [_deps] : _deps;
    const depArgs = await getDepArgs(deps);
    firstRequestedDeps ??= deps;
    const id = toJobId(await run(step.name, depArgs));
    tasks.set(step.name, id);
  }
  return [...tasks.values()];
}

class Tasks extends Map<string, number> {
  async getLots(...name: string[]) {
    const ids = await Promise.all(
      name.map(async (n) => {
        if (this.has(n)) {
          // task cannot run, skip
          if (this.get(n) === -1) return [];
          return [this.get(n)!];
        }
        const skip = await new Confirm({
          default: true,
          message:
            `Dependency ${n} not found in previous tasks. If you're sure that the task is completed, you can skip it. Skip?`,
        }).prompt();
        if (skip) return [];
        const newDepId = await new NumberType({
          message:
            `Provide the job id of task ${n}, the task should be a job array: `,
          min: 1,
        }).prompt();
        return [newDepId];
      }),
    );
    return ids.flat();
  }
}
