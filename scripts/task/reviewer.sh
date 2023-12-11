#!/bin/bash 

set -eo pipefail

INPUT_EH_RESULT_FILES=$1
REF=$2

if [ -z "$INPUT_EH_RESULT_FILES" ] || [ -z "$REF" ]; then
  echo "Usage: $0 <input> <assembly (hg19/hg38)> --locus <locus> --output-prefix <output_name>"
  echo "Example (input: ./25274ysl_realigned.bam): $0 ./25274ysl hg19 --locus DMPK --output-prefix 25274ysl.dmpk"
  exit 1
fi

if [ $2 == "hg19" ]; then
  CATALOG=/cluster/home/jiyuan/res/str-analysis/str_analysis/variant_catalogs/variant_catalog_without_offtargets.GRCh37.json
  REF=/cluster/home/jiyuan/res/hg19/hs37d5.fa
elif [ $2 == "hg38" ]; then
  CATALOG=/cluster/home/jiyuan/res/str-analysis/str_analysis/variant_catalogs/variant_catalog_without_offtargets.GRCh38.json
  REF=/cluster/home/jiyuan/res/hg38/GCA_000001405.15_GRCh38_no_alt_analysis_set.fa
fi

INPUT_BAM="${INPUT_EH_RESULT_FILES}_realigned.bam"
SORTED_BAM="${INPUT_EH_RESULT_FILES}_realigned.sorted.bam"
if [ ! -f "$SORTED_BAM" ]; then
  echo "Sorting $SORTED_BAM"
  TMP_DIR=$(mktemp -d)
  trap "rm -rf $TMP_DIR" EXIT
  samtools sort "$INPUT_BAM" -o "$TMP_DIR/realigned.sorted.bam" -T "$TMP_DIR/sort.tmp"
  mv "$TMP_DIR/realigned.sorted.bam" "$SORTED_BAM"
fi
if [ ! -f "$SORTED_BAM.bai" ]; then
  echo "Indexing $SORTED_BAM"
  samtools index "$SORTED_BAM"
fi

/genetics/home/stu_liujiyuan/.local/bin/REViewer \
  --reads "$SORTED_BAM" \
  --vcf "${INPUT_EH_RESULT_FILES}.vcf" \
  --catalog $CATALOG \
  --reference $REF \
  "$@"