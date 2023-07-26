import { getTempDir } from "@/utils/tmp-dir.ts";

export const required = ["gatk"];

export interface GATKOptions {
  javaOptions?: string[];
  args?: string[];
}

export function toJavaOptions(options: GATKOptions) {
  return options.javaOptions
    ? ["--java-options", options.javaOptions.join(" ")]
    : [];
}

export function gatkTempDir(allCap = false) {
  return [allCap ? "--TMP_DIR" : "--tmp-dir", getTempDir()];
}
export function gatkTempDirJava() {
  return `-Djava.io.tmpdir=${getTempDir()}`;
}
