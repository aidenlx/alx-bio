import { basename, assert, join } from "../deps.ts";
import { parseSegmentQuery } from "./parse.ts";

export async function getBamSegment({
  inputBam,
  outputName = basename(inputBam).split(".")[0],
  range: _range,
  sshDest,
}: {
  inputBam: string;
  outputName?: string;
  range: string;
  sshDest: string;
}) {
  const bam = `${outputName}.bam`,
    bamIdx = `${bam}.bai`;

  // IGV can handle chr-less ranges, but samtools can't, detect it in remote
  const range = parseSegmentQuery(_range).replace(/^chr/, "");
  console.info(`Getting bam segment: ${range} (${_range})`);
  const localTmpDir = await Deno.makeTempDir();

  const script = `#!/bin/bash
set -e
REMOTE_SCRIPT='TMP_DIR=$(mktemp -d); cd $TMP_DIR; __cleanup () { rm -rf $TMP_DIR; }; trap __cleanup EXIT;
RANGE_PREFIX=$(samtools view "${inputBam}" -H | grep '@SQ' | cut -f 2 | grep -q 'chr' && echo 'chr' || echo '');
samtools view "${inputBam}" -h $RANGE_PREFIX"${range}" | samtools sort -o "${bam}" - && samtools index "${bam}" \
&& tar -c "${bam}" "${bamIdx}"'

ssh -C "${sshDest}" -t /bin/bash $REMOTE_SCRIPT | tar -x -C "${localTmpDir}"
`;

  const remote = new Deno.Command("bash", {
    stdin: "piped",
    stdout: "null",
    stderr: "piped",
  }).spawn();

  toReadableStream(script).pipeTo(remote.stdin);

  const remoteResp = await remote.output();

  assert(
    remoteResp.success,
    `Error running remote script: (${
      remoteResp.code
    }) ${new TextDecoder().decode(remoteResp.stderr)}`
  );

  return {
    bam: join(localTmpDir, bam),
    range,
    async cleanup() {
      await Deno.remove(localTmpDir, { recursive: true });
    },
  };
}

function toReadableStream(input: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(input));
      controller.close();
    },
  });
}
