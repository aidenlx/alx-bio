import { build, stop } from "https://deno.land/x/esbuild@v0.18.17/mod.js";
// import { transform } from "https://deno.land/x/swc@0.2.1/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.194.0/path/mod.ts";
// import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts";

const entry = fromFileUrl(import.meta.resolve("./functions.js"));
const outfile = fromFileUrl(
  import.meta.resolve("../scripts/slivar-functions.js")
);
const exportsPatch = `
export {
  hq,
  hq1,
  denovo,
  x_denovo,
  uniparent_disomy,
  recessive,
  x_recessive,
  solo_ch_het_side,
  comphet_side,
  fake_auto_dom,
  segregating_dominant_x,
  hom_ref,
  hom_ref_parent,
  segregating_dominant,
  segregating_recessive_x,
  segregating_recessive,
  parents_x_dn_or_homref,
  segregating_denovo_x,
  affected_het_leaf,
  segregating_denovo,
};
`;

const bundled = await build({
  entryPoints: [entry],
  bundle: true,
  target: "es6",
  format: "iife",
  // minify: true,
  write: false,
  plugins: [
    {
      name: "builtin-loader",
      setup(build) {
        build.onLoad({ filter: /slivar-functions\.js$/ }, async ({ path }) => {
          const code = await Deno.readTextFile(path);
          return {
            contents: code + "\n" + exportsPatch,
            loader: "js",
          };
        });
      },
    },
  ],
  // plugins: [...denoPlugins()],
});
stop();
const outFile = bundled.outputFiles.at(0);

if (!outFile) throw new Error("no output file");
const outContent = outFile.text.replace(/\(\(\)\s*=>\s*\{|\}\)\(\);\s+$/g, "");
// const { code: transpiled } = transform(
//   outContent.text.replace(/\(\(\) => \{|\}\)\(\);\s+$/g, ""),
//   {
//     // minify: true,
//     jsc: {
//       target: "es5",
//     },
//   }
// );

await Deno.writeTextFile(outfile, outContent);
