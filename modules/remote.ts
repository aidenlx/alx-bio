import { basename, assert, join, $ } from "../deps.ts";

export async function getBamSegment({
  inputBam,
  region,
  outputName = `${basename(inputBam).split(".")[0]}-${region.replace(
    ":",
    "-"
  )}`,
  sshDest,
}: {
  inputBam: string;
  outputName?: string;
  region: string;
  sshDest: string;
}) {
  const bam = `${outputName}.bam`,
    bamIdx = `${bam}.bai`;

  const localTmpDir = await Deno.makeTempDir();

  const remoteScript = `#!/bin/bash
set -e
TMP_DIR=$(mktemp -d);
__cleanup () { rm -rf $TMP_DIR; }; trap __cleanup EXIT
RANGE_PREFIX=$(samtools view "${inputBam}" -H | grep '@SQ' | cut -f 2 | grep -q 'chr' && echo 'chr' || echo '');
samtools view "${inputBam}" -h $RANGE_PREFIX"${region}" \
| samtools sort -o $TMP_DIR/"${bam}" - && samtools index $TMP_DIR/"${bam}" \
&& cd $TMP_DIR && tar -c "${bam}" "${bamIdx}"`;

  const remoteResp =
    await $`ssh -C ${sshDest} ${remoteScript} | tar -x -C ${localTmpDir}`

  assert(
    remoteResp.exitCode === 0,
    `Error running remote script: (${remoteResp.exitCode}) ${remoteResp.stderr}`
  );

  return {
    bam: join(localTmpDir, bam),
    async cleanup() {
      await Deno.remove(localTmpDir, { recursive: true });
    },
  };
}
