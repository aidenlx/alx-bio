#!/bin/bash

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

conda activate manta

ASSEMBLY=$(validate_input ${1,,} hg19 hg38)
if [ $ASSEMBLY == "hg19" ]; then
  REF=$(get_ref hs37)
elif [ $ASSEMBLY == "hg38" ]; then
  REF=$(get_ref hg38)
fi
INPUT_BAM=$2
OUT_DIR=${3:-.}

# https://github.com/Illumina/manta/blob/master/docs/userGuide/README.md#configuration
configManta.py \
  --bam $INPUT_BAM \
  --referenceFasta $REF \
  --runDir $OUT_DIR