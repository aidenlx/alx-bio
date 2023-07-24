import { readLines } from "https://deno.land/std@0.193.0/io/read_lines.ts";
import {
  $,
  Command,
  EnumType,
  formatDate,
  join,
  exists,
  dirname,
} from "./deps.ts";
import type { ProcessOutput, ProcessPromise } from "./deps.ts";
const commonOptions = [
  "--parsable",
  "--output",
  "log-%A-%x_%a.out",
  "--error",
  "log-%A-%x_%a.err",
];

const currTime = formatDate(new Date(), "M-d-Hm");

const ref = new EnumType(["hg19", "hg38"]);
const method = new EnumType(["wes", "wgs"]);
const script = (file: string) =>
  join("/genetics/home/stu_liujiyuan/pipeline/scripts/array", file);

const toJobId = (resp: ProcessOutput) => {
  if (resp.exitCode !== 0) {
    throw new Error("Job submission failed: " + resp.stderr);
  }
  return Number.parseInt(resp.stdout.trim(), 10);
};

export default new Command()
  .name("arr-sumbit")
  .description("Inspect a list of variant calls in a BAM file")
  .option("-a, --array <array:string>", "job array index values")
  .option("--dependency <deps:string>", "job dependency")
  .option("-p, --partition <partition:string>", "partition")
  .option("--exclude <exclude:string>", "exclude nodes")
  .type("ref", ref)
  .type("method", method)
  .option("--parsable", "parsable output")
  .option("-J, --job-name <jobName:string>", "job name", {
    default: currTime,
  })
  .option("-m, --method <type:method>", "method", { required: true })
  .option("-r, --ref <ref:ref>", "reference genome", { required: true })
  .option("--interval <interval:file>", "interval BED file")
  .option("--pick <task_range:string>", "pick tasks to run")
  .option("--no-cleanup", "do not clean up intermediate files")
  .arguments("<array_file:file>")
  .action(async (options, arrayFile) => {
    const job = (name: string) => ["-J", `${options.jobName}-${name}`];

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
    if (options.array) {
      if (options.array.startsWith("%")) {
        array = `1-${lineCount}` + options.array;
      } else {
        array = options.array;
      }
    }
    console.log(`Array file line count: ${lineCount}`);
    console.log(`Array index: ${array}`);

    const opts = [
      ...commonOptions,
      ...["-a", array],
      ...(options.partition ? ["-p", options.partition] : []),
      ...(options.exclude ? ["--exclude", options.exclude] : []),
    ];

    const intevalOption =
      options.interval && options.method === "wes"
        ? ["--bait-intervals", options.interval]
        : [];
    const cleanup = options.cleanup ? "" : "--no-cleanup";

    const ref_call = options.ref === "hg19" ? "hs37" : options.ref;
    const ref_annot = options.ref;

    const TaskList = {
      align(name, dep) {
        return $`sbatch ${opts} ${job(name)} ${dep()} ${script(
          "snv-align.slurm"
        )} ${arrayFile} ${ref_call} ${options.method} ${cleanup}`;
      },
      bam(name, dep) {
        return $`sbatch ${opts} ${job(name)} ${dep("align")} ${script(
          "snv-bam.slurm"
        )} ${arrayFile} ${ref_call} ${
          options.method
        } ${cleanup} ${intevalOption}`;
      },
      vcf(name, dep) {
        return $`sbatch ${opts} ${job(name)} ${dep("bam")} ${script(
          "snv-vcf.slurm"
        )} ${arrayFile} ${ref_call} ${
          options.method
        } ${cleanup} ${intevalOption}`;
      },
      merge(name, dep) {
        return $`sbatch ${opts} ${job(name)} ${dep("vcf")} ${script(
          "snv-merge.slurm"
        )} ${arrayFile} ${ref_call}`;
      },
      cadd(name, dep) {
        return $`sbatch ${opts} ${job(name)} ${dep("merge")} ${script(
          "cadd.slurm"
        )} ${arrayFile} ${ref_annot}`;
      },
      annot_single(name, dep) {
        return $`sbatch ${opts} ${job(name)} ${dep("merge")} ${script(
          "snv-annot-s.slurm"
        )} ${arrayFile} ${ref_annot}`;
      },
      annot_multi(name, dep) {
        return $`sbatch ${opts} ${job(name)} ${dep("annot_single")} ${script(
          "snv-annot-m.slurm"
        )} ${arrayFile} ${ref_annot}`;
      },
      final(name, dep) {
        return $`sbatch ${opts} ${job(name)} ${dep(
          "cadd",
          "annot_single"
        )} ${script("snv-final.slurm")} ${arrayFile} ${ref_annot}`;
      },
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

    const taskList = parsePick(options.pick);

    const jobIds = await pipe(options.dependency, ...taskList);
    if (options.parsable) {
      console.log(jobIds.join(" "));
    } else {
      console.log("Submitted jobs: " + jobIds.join(" "));
    }

    await Deno.writeTextFile(
      join(dirname(arrayFile), `job-${currTime}.txt`),
      jobIds.join("\n")
    );
  });

type Task = (
  name: string,
  getDeps: (...name: string[]) => string[]
) => ProcessPromise;

async function pipe(initDep: string | undefined, ...steps: Task[]) {
  const tasks = new Tasks();
  let initial = true;
  function getDeps(...names: string[]) {
    if (initial && initDep) {
      return ["--dependency", initDep];
    } else if (!initial && names.length > 0) {
      return ["--dependency", `aftercorr:${tasks.getLots(...names).join(",")}`];
    }
    return [];
  }
  for (const step of steps) {
    const id = toJobId(await step(step.name, getDeps));
    initial = false;
    tasks.set(step.name, id);
  }
  return [...tasks.values()];
}

class Tasks extends Map<string, number> {
  getLots(...name: string[]) {
    return name.map((n) => {
      const id = this.get(n);
      if (!id) throw new Error("Task not found: " + n);
      return id;
    });
  }
}
