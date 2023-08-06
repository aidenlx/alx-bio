#/bin/bash

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

INPUT=$1
OUTPUT=$3

if [ -z "$OUTPUT" ] || [ -z "$INPUT" ]; then
  echo "Usage: $0 <input> <assembly (hg19/hg38)> <output_name>"
  exit 1
fi
ASSEMBLY=$(validate_input ${2,,} hg19 hg38)

conda activate /genetics/home/stu_liujiyuan/miniconda3/envs/annotsv
if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY=GRCh37
elif [ $ASSEMBLY == "hg38" ]; then
  ASSEMBLY=GRCh38
fi

AnnotSV -SVinputFile $INPUT -outputFile $OUTPUT -genomeBuild $ASSEMBLY 