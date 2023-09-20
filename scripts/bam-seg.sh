#!/bin/bash
set -eo pipefail

TMP_DIR=$(mktemp -d);

__cleanup () { rm -rf $TMP_DIR; }; trap __cleanup EXIT

INPUT_BAM=$1
REGION=$2
OUTPUT_BAM=$3

if ! which samtools > /dev/null 2>&1; then
  export PATH="/cluster/home/jiyuan/mambaforge/bin/:$PATH"
fi

RANGE_PREFIX=$(samtools view "$INPUT_BAM" -H | grep '@SQ' | cut -f 2 | grep -q 'chr' && echo 'chr' || echo '');

samtools view "$INPUT_BAM" -h $RANGE_PREFIX"$REGION" \
  | samtools sort -o $TMP_DIR/"$OUTPUT_BAM" - && samtools index $TMP_DIR/"$OUTPUT_BAM"

# if last command succeed
if [ $? -eq 0 ]; then
  cd $TMP_DIR && tar -c "$OUTPUT_BAM" "$OUTPUT_BAM".bai
else exit 1
fi