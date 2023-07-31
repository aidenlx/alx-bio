import {
  $,
  Command,
  EnumType,
  formatDate,
  join,
  exists,
  dirname,
  readLines,
  Confirm,
  Number as NumberType,
} from "@/deps.ts";
import type { ProcessOutput, ProcessPromise } from "@/deps.ts";
import { genomeAssembly } from "@/modules/common.ts";
const commonOptions = [
  "--parsable",
  "--output",
  "log-%A-%x_%a.out",
  "--error",
  "log-%A-%x_%a.err",
];

const currTime = formatDate(new Date(), "M-d-Hm");

const script = (file: string) =>
  join("/genetics/home/stu_liujiyuan/pipeline/scripts/array", file);

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
  .option("-m, --method <type:method>", "method", { required: true })
  .option("-r, --ref <ref:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option(
    "--no-cadd-script",
    "use prescored CADD score in favor of CADD script"
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
        "Array file does not exist or is not readable: " + arrayFile
      );
    }
    const list = await Deno.open(arrayFile, { read: true });
    console.log(`Reading array file: ${arrayFile}`);
    let lineCount = 0;
    for await (const line of readLines(list)) {
      lineCount++;
      const lineNum = line.split("\t")[0].trim();
      if (lineNum !== String(lineCount)) {
        throw new Error(
          `Array index not match at line ${lineCount}: ${arrayFile}`
        );
      }
    }

    let array = `1-${lineCount}%4`;
    if (opts.array) {
      if (opts.array.startsWith("%")) {
        array = `1-${lineCount}` + opts.array;
      } else {
        array = opts.array;
      }
    }
    console.log(`Array file line count: ${lineCount}`);
    console.log(`Array index: ${array}`);

    const slurmOpts = [
      ...commonOptions,
      ...["-a", array],
      ...(opts.partition ? ["-p", opts.partition] : []),
      ...(opts.exclude ? ["--exclude", opts.exclude] : []),
    ];

    let baitOption: string[] = [],
      targetOption: string[] = [];
    if (opts.method === "wes") {
      if (opts.baitIntervals)
        baitOption = ["--bait-intervals", opts.baitIntervals];
      if (opts.targetIntervals)
        targetOption = ["--target-intervals", opts.targetIntervals];
    }

    const cleanup = opts.cleanup ? "" : "--no-cleanup";

    const ref_call = opts.ref === "hg19" ? "hs37" : opts.ref;
    const ref_annot = opts.ref;

    const TaskList = {
      align: () => ({
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "snv-align.slurm"
          )} ${arrayFile} ${ref_call} ${cleanup}`,
      }),
      hs_stat: () => ({
        deps: "align",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "snv-hs-stat.slurm"
          )} ${arrayFile} ${ref_call} ${baitOption} ${targetOption}`,
        canRun: opts.method === "wes" && ref_call === "hs37",
      }),
      bam: () => ({
        deps: "align",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "snv-bam.slurm"
          )} ${arrayFile} ${ref_call} ${opts.method} ${cleanup} ${baitOption}`,
      }),
      vcf: () => ({
        deps: "bam",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "snv-vcf.slurm"
          )} ${arrayFile} ${ref_call} ${opts.method} ${cleanup} ${baitOption}`,
      }),
      merge: () => ({
        deps: "vcf",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "snv-merge.slurm"
          )} ${arrayFile} ${ref_call}`,
      }),
      cadd: () => ({
        deps: "merge",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "cadd.slurm"
          )} ${arrayFile} ${ref_annot}`,
        canRun: useCADDScript,
      }),
      annot_s: () => ({
        deps: "merge",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "snv-annot-s.slurm"
          )} ${arrayFile} ${ref_annot}`,
      }),
      annot_m: () => ({
        deps: "annot_s",
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "snv-annot-m.slurm"
          )} ${arrayFile} ${ref_annot} ${useCADDScript ? "--no-cadd" : ""}`,
      }),
      final: () => ({
        deps: ["cadd", "annot_m"],
        run: (name, deps) =>
          $`sbatch ${slurmOpts} ${job(name)} ${deps} ${script(
            "snv-final.slurm"
          )} ${arrayFile} ${ref_annot} ${
            !useCADDScript ? "--no-cadd-script" : ""
          }`,
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
          tasks.indexOf(endTask) + 1
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

    const jobIds = await pipe(opts.dependency, ...taskList);
    if (opts.parsable) {
      console.log(jobIds.join(" "));
    } else {
      console.log("Submitted jobs: " + jobIds.join(" "));
    }

    await Deno.writeTextFile(
      join(dirname(arrayFile), `job-${currTime}.txt`),
      jobIds.join("\n")
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
        ...depNames.filter((n) => !frDeps.includes(n))
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
      console.log("Skip task: " + step.name);
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
          message: `Dependency ${n} not found in previous tasks. If you're sure that the task is completed, you can skip it. Skip?`,
        }).prompt();
        if (skip) return [];
        const newDepId = await new NumberType({
          message: `Provide the job id of task ${n}, the task should be a job array: `,
          min: 1,
        }).prompt();
        return [newDepId];
      })
    );
    return ids.flat();
  }
}
