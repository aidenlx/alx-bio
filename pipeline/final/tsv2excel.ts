import { $ } from "@/deps.ts";
import { checkDone } from "@/utils/check-done.ts";

export default async function tsv2excel(
  inputTsvGz: string,
  outputCsvGz: string
) {
  const { done, finish } = await checkDone(outputCsvGz, inputTsvGz);
  if (done) {
    console.error(`Skip converting ${inputTsvGz} to excel csv format...`);
    return outputCsvGz;
  }
  console.error(`Converting ${inputTsvGz} to excel csv format...`);
  // write BOM header (printf "\xEF\xBB\xBF")
  const outputCsv = outputCsvGz.slice(0, -3);
  await $`printf "\\xEF\\xBB\\xBF" > ${outputCsv} && \
zcat ${inputTsvGz} | xsv fmt -d '\\t' --crlf >> ${outputCsv} \
&& bgzip -f ${outputCsv}`;
  await finish();
  return outputCsvGz;
}
