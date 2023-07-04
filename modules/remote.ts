import { basename, assert, join, $ } from "../deps.ts";

export async function getBamSegment({
  inputBam,
  range,
  outputName = `${basename(inputBam).split(".")[0]}-${range.replace(":", "-")}`,
  sshDest,
}: {
  inputBam: string;
  outputName?: string;
  range: string;
  sshDest: string;
}) {
  const bam = `${outputName}.bam`,
    bamIdx = `${bam}.bai`;

  const localTmpDir = await Deno.makeTempDir();

  const remoteScript = `#!/bin/bash
set -e
INPUT_BAM=$(realpath "${inputBam}")
TMP_DIR=$(mktemp -d); cd $TMP_DIR
__cleanup () { rm -rf $TMP_DIR; }; trap __cleanup EXIT
RANGE_PREFIX=$(samtools view "$INPUT_BAM" -H | grep '@SQ' | cut -f 2 | grep -q 'chr' && echo 'chr' || echo '');
samtools view "$INPUT_BAM" -h $RANGE_PREFIX"${range}" \
| samtools sort -o "${bam}" - && samtools index "${bam}" \
&& tar -c "${bam}" "${bamIdx}"`;

  const remoteResp =
    await $`ssh -C ${sshDest} ${remoteScript} | tar -x -C ${localTmpDir}`.quiet();

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
