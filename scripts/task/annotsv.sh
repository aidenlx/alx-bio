#!/bin/bash

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

INPUT=$1
OUTPUT=$3

if [ -z "$OUTPUT" ] || [ -z "$INPUT" ]; then
  echo "Usage: $0 <input> <assembly (hg19/hg38)> <output_name>"
  exit 1
fi
ASSEMBLY=$(validate_input ${2,,} hg19 hg38)

conda activate $HOME/miniconda3/envs/annotsv
if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY=GRCh37
elif [ $ASSEMBLY == "hg38" ]; then
  ASSEMBLY=GRCh38
fi

if [[ $INPUT == *.gz ]]; then
  zcat "$INPUT" > "${INPUT%.gz}"
  INPUT=${INPUT%.gz}
fi

AnnotSV -SVinputFile $INPUT -outputFile $OUTPUT -genomeBuild $ASSEMBLY 