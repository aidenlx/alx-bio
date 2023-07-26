export function genCleanupFunc(opts: {
  cleanup: boolean;
}): (...files: string[]) => Promise<void> | void {
  if (!opts.cleanup) return () => void 0;
  return async (...files: string[]) => {
    console.error("cleaning up: ", files)
    await Promise.all(files.map((f) => Deno.remove(f)));
  };
}
