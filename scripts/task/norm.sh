#!/bin/bash

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

conda activate snv-final

INPUT=$1
OUTPUT=$3

if [ -z "$ALXBIO_RES"] ; then
  ALXBIO_RES="/cluster/home/jiyuan/res"
fi

if [ -z "$OUTPUT" ] || [ -z "$INPUT" ]; then
  echo "Usage: $0 <input> <assembly (hg19/hg38)> <output_name>"
  exit 1
fi
ASSEMBLY=$(validate_input ${2,,} hg19 hg38)

if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY="${ALXBIO_RES}/hg19/hs37d5.fa"
elif [ $ASSEMBLY == "hg38" ]; then
  ASSEMBLY="${ALXBIO_RES}/hg38/GCA_000001405.15_GRCh38_no_alt_analysis_set.fa"
fi

bcftools norm -m -both -f $ASSEMBLY $INPUT -o $OUTPUT