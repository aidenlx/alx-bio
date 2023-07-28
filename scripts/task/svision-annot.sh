#/bin/bash

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh

INPUT=$1
FIXED=$(mktemp --suffix ".vcf")
OUTPUT=$3

if [ -z "$OUTPUT" ] || [ -z "$INPUT" ]; then
  echo "Usage: $0 <input> <assembly (hg19/hg38)> <output_name>"
  echo "Example: $0 /path/to/SAMPLE.svision.s5.graph.vcf hg19 SAMPLE"
  exit 1
fi
ASSEMBLY=$(validate_input ${2,,} hg19 hg38)

conda activate /genetics/home/stu_liujiyuan/miniconda3/envs/annotsv
if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY=GRCh37
elif [ $ASSEMBLY == "hg38" ]; then
  ASSEMBLY=GRCh38
fi

trap "rm -f \"$FIXED\"" EXIT

awk 'BEGIN {FS=OFS="\t"} {split($8, info, ";"); for (i in info) {if (info[i] ~ /^SVTYPE=/) {split(info[i], svtype, "="); $5="<"svtype[2]">"}}; print}' \
  "$INPUT" > "$FIXED"

AnnotSV -SVinputFile $FIXED -outputFile $OUTPUT -genomeBuild $ASSEMBLY 