import { checkDone } from "@/utils/check-done.ts";
import { $, ensureDir, exists, join, resolve } from "@/deps.ts";
import { CanvasRes } from "@/pipeline/_res.ts";

export const required = [];

export type SampleType = "father" | "mother" | "proband";
export type SupportedRef = "hg38";

export const isCanvasSampleType = (v: string): v is SampleType =>
  ["father", "mother", "proband"].includes(v);

export default async function Canvas(
  input: (readonly [bam: string, type: SampleType])[],
  outDir: string,
  opts: {
    assembly: SupportedRef;
  }
) {
  const { done, finish } = await checkDone(
    join(outDir, "canvas"),
    input.map(([file]) => file)
  );

  if (done) {
    console.error("Skipping Canvas");
    return;
  }

  await $`docker load < ${CanvasRes.dockerImage}`;

  const [uid, gid] = (await Promise.all([$`id -u`, $`id -g`])).map((v) =>
    v.toString().trim()
  );
  const user = `${uid}:${gid}`;

  const baiChecks = await Promise.all(
    input.map(async ([bam]) => [bam, await exists(bam + ".bai")] as const)
  );
  if (baiChecks.some(([, exists]) => !exists)) {
    throw new Error(`Index file not found: ${baiChecks.find(([, e]) => !e)}`);
  }

  await ensureDir(outDir);

  // not yet compatible with hg19/hs37, corr resource and populationBAlleleVcf not ready

  const volumes = [
    `${CanvasRes.resDir[opts.assembly]}:/resource`,
    `${CanvasRes.resDir[opts.assembly]}:/Sequence`,
    `${resolve(outDir)}:/data`,
    `${CanvasRes.populationBAlleleVcf[opts.assembly]}:/resource/population.vcf`,
    ...input.flatMap(([bam], i) => {
      const fullPath = resolve(bam);
      return [`${fullPath}:/bam/${i}.bam`, `${fullPath}.bai:/bam/${i}.bam.bai`];
    }),
  ].flatMap((volume) => ["-v", volume]);

  const inputs = input.flatMap(([, type], i) => [`--bam=/bam/${i}.bam`, type]);

  const resp = await $`docker run ${volumes} --user ${user} --rm \
  canvas:1.40.0.1613 SmallPedigree-WGS ${inputs} \
  -r "/resource/kmer.fa" \
  -g "/resource/WholeGenomeFasta" \
  -f "/resource/filter13.bed" \
  --population-b-allele-vcf "/resource/population.vcf" \
  -o ./results/ `;

  if (resp.exitCode !== null && resp.exitCode !== 0) {
    throw new Error(`Canvas failed with exit code ${resp.exitCode}`);
  }

  await finish();
}
