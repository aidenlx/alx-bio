import { Command, CsvParseStream, CsvStringifyStream, join } from "./deps.ts";
import { genomeAssembly } from "./modules/common.ts";
import {
  RCSingle,
  RepeatCatalogs,
  extraColPrepend,
  extraColAppend,
  Genotype,
  RepeatCatalogDisease,
} from "./modules/rc.type.ts";

// const extraColumns = [
//   "VariantType",
//   "LocusId",
//   "LocusStructure",
//   "VariantId",
// ] as const;

export default new Command()
  .name("str.annot")
  .type("genomeAssembly", genomeAssembly)
  .option("-r, --ref <ref:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("--resource <dir:string>", "Path to Resource", {
    default: "/genetics/home/stu_liujiyuan/alx-bio/deno-csv/res/",
  })
  .option("-i, --input <file:string>", "input file", { required: true })
  .option("-o, --output <file:string>", "output prefix", { required: true })
  .action(async ({ ref: assembly, input, output, resource }) => {
    // const repeatCatalogs = await fetchCached(
    //   `https://github.com/Illumina/RepeatCatalogs/raw/master/${assembly}/variant_catalog.json`
    // ).then((resp) => resp.json() as Promise<typeof RepeatCatalogs.infer>);
    // const pathogenicCatalogs = await fetchCached(
    //   `https://github.com/broadinstitute/str-analysis/raw/main/str_analysis/variant_catalogs/variant_catalog_without_offtargets.GRCh${
    //     assembly === "hg19" ? "37" : "38"
    //   }.json`
    // ).then((resp) => resp.json() as Promise<RepeatCatalogDisease[]>);

    const repeatCatalogs: typeof RepeatCatalogs.infer = await Deno.readTextFile(
      join(resource, `variant_catalog.${assembly}.json`)
    ).then(JSON.parse);
    const pathogenicCatalogs: RepeatCatalogDisease[] = await Deno.readTextFile(
      join(resource, `variant_catalog_known.${assembly}.json`)
    ).then(JSON.parse);

    const RegionMap = buildRegionIndex(repeatCatalogs);
    const PathogenicMap = new Map(
      pathogenicCatalogs.map((d) => [d.LocusId, d])
    );

    function transformUnknown(
      chunk: string[],
      controller: TransformStreamDefaultController<any>
    ) {
      if (chunk[0].startsWith("#chrom")) {
        // controller.enqueue(chunk.concat(extraColumns));
        controller.enqueue(chunk);
        return;
      }
      const [chrom, start, end] = chunk;
      const id = `chr${chrom}:${Number.parseInt(start, 10) - 1}-${end}`;
      const repeatCatalogs = RegionMap.get(id) ?? [];
      if (repeatCatalogs.some((c) => PathogenicMap.has(c.LocusId))) {
        // skip if pathogenic
        return;
      }
      return controller.enqueue(chunk);
      // const regions = repeatCatalogs.reduce(
      //   (acc, region) => {
      //     acc.LocusId.push(region.LocusId);
      //     acc.LocusStructure.push(region.LocusStructure);
      //     acc.VariantType.push(region.VariantType);
      //     acc.VariantId.push(region.VariantId ?? "");
      //     return acc;
      //   },
      //   {
      //     LocusId: [],
      //     LocusStructure: [],
      //     VariantType: [],
      //     VariantId: [],
      //   } as Record<(typeof extraColumns)[number], string[]>
      // );
      // return controller.enqueue(
      //   chunk.concat(extraColumns.map((k) => regions[k].join() || "-"))
      // );
    }
    const separator = "\t";

    await (
      await Deno.open(input, { read: true })
    ).readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new CsvParseStream({ skipFirstRow: false, separator }))
      .pipeThrough(new TransformStream({ transform: transformUnknown }))
      .pipeThrough(new CsvStringifyStream({ separator, crlf: false }))
      .pipeThrough(new TextEncoderStream())
      .pipeTo(
        (
          await Deno.open(`${output}.unknown.bed`, {
            write: true,
            create: true,
          })
        ).writable
      );

    function transformPathogenic(
      chunk: string[],
      controller: TransformStreamDefaultController<any>
    ) {
      if (chunk[0].startsWith("#chrom")) {
        const [chrom, start, end, ...rest] = chunk;
        return controller.enqueue([
          chrom,
          start,
          end,
          ...extraColPrepend,
          ...rest,
          ...extraColAppend,
        ]);
      }
      const [
        chrom,
        start,
        end,
        repeat,
        a1_size,
        a1_repeat,
        a1_support,
        a2_size,
        a2_repeat,
        a2_support,
        ...rest
      ] = chunk;
      if (
        (a1_repeat !== "-" && Number.isNaN(Number.parseFloat(a1_repeat))) ||
        (a2_repeat !== "-" && Number.isNaN(Number.parseFloat(a2_repeat)))
      ) {
        throw new Error(
          `"repeat is not a number: ${a1_repeat},${a2_repeat}: ${chunk}`
        );
      }
      const id = `chr${chrom}:${Number.parseInt(start, 10) - 1}-${end}`;
      const repeatCatalogs = RegionMap.get(id) ?? [];
      if (!repeatCatalogs.some((c) => PathogenicMap.has(c.LocusId))) {
        // skip if not known pathogenic
        return;
      }
      const rows = repeatCatalogs
        .flatMap((c) =>
          PathogenicMap.has(c.LocusId) ? [PathogenicMap.get(c.LocusId)!] : []
        )
        .flatMap((c) =>
          c.Diseases.map((disease) => {
            const prepend = Object.fromEntries(
              extraColPrepend.map((k) => [k, ""])
            ) as Record<(typeof extraColPrepend)[number], string | number>;
            const append = Object.fromEntries(
              extraColAppend.map((k) => [k, ""])
            ) as Record<(typeof extraColAppend)[number], string | number>;

            append.DiseaseOMIM = disease.OMIM;
            append.NormalMax = disease.NormalMax ?? "-";
            append.PathogenicMin = disease.PathogenicMin;
            append.IntermediateRange = disease.IntermediateRange ?? "-";

            prepend.DiseaseSymbol = disease.Symbol;
            append.DiseaseName = disease.Name;
            prepend.Inheritance = disease.Inheritance;
            prepend.IsMainRegion = Number(
              c.MainReferenceRegion === c.ReferenceRegion
            );
            prepend.Gene = c.Gene;
            prepend.GeneRegion = c.GeneRegion;
            prepend.GeneId = c.GeneId;
            prepend.RepeatUnit = c.RepeatUnit ?? "-";
            prepend.PathogenicMotif = c.PathogenicMotif ?? "-";
            const { PathogenicMin, NormalMax, IntermediateRange: r } = disease;
            const IntermediateRange = r ? r.split("-") : undefined;
            function genotype(repeat: number) {
              if (Number.isNaN(repeat)) {
                return Genotype.Missing;
              } else if (repeat >= PathogenicMin) {
                return Genotype.Pathogenic;
              } else if (NormalMax !== undefined && repeat <= NormalMax) {
                return Genotype.Normal;
              } else if (
                IntermediateRange !== undefined &&
                repeat >= +IntermediateRange[0] &&
                repeat <= +IntermediateRange[1]
              ) {
                return Genotype.Intermediate;
              } else {
                return Genotype.NotPathogenic;
              }
            }
            prepend["Allele1-GT"] = genotype(+a1_repeat);
            prepend["Allele2-GT"] = genotype(+a2_repeat);
            return [
              chrom,
              start,
              end,
              ...Object.values(prepend),
              repeat,
              a1_size,
              a1_repeat,
              a1_support,
              a2_size,
              a2_repeat,
              a2_support,
              ...rest,
              ...Object.values(append),
            ];
          })
        );

      rows.forEach((row) => controller.enqueue(row));
    }

    await (
      await Deno.open(input, { read: true })
    ).readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new CsvParseStream({ skipFirstRow: false, separator }))
      .pipeThrough(new TransformStream({ transform: transformPathogenic }))
      .pipeThrough(new CsvStringifyStream({ separator, crlf: false }))
      .pipeThrough(new TextEncoderStream())
      .pipeTo(
        (
          await Deno.open(`${output}.pathogenic.bed`, {
            write: true,
            create: true,
            truncate: true,
          })
        ).writable
      );
  });

function buildRegionIndex(repeatCatalogs: typeof RepeatCatalogs.infer) {
  const RegionMap = new Map<string, (typeof RCSingle.infer)[]>();
  function addRegionMap(d: typeof RCSingle.infer) {
    if (!RegionMap.has(d.ReferenceRegion)) {
      RegionMap.set(d.ReferenceRegion, [] as any);
    }
    RegionMap.get(d.ReferenceRegion)!.push(d);
  }
  repeatCatalogs.forEach((d) => {
    if (RCSingle.allows(d)) {
      addRegionMap(d);
    } else {
      d.ReferenceRegion.forEach((region, i) => {
        addRegionMap({
          LocusId: d.LocusId,
          LocusStructure: d.LocusStructure,
          VariantType: d.VariantType[i],
          VariantId: d.VariantId ? d.VariantId[i] : undefined,
          ReferenceRegion: region,
        });
      });
    }
  });
  return RegionMap;
}
// if (!isOneToOne(list)) {
//   throw new Error(
//     "ReferenceRegion - VariantType - VariantId is not one-to-one"
//   );
// }

// function isOneToOne(list: (typeof multiple.infer | typeof single.infer)[]) {
//   return list.some((data) => {
//     if (!multiple.allows(data)) return false;
//     return (
//       data.ReferenceRegion.length !== data.VariantType.length ||
//       (data.VariantId && data.VariantId.length !== data.VariantType.length)
//     );
//   });
// }
