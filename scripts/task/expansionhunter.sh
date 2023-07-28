#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
source /genetics/home/stu_liujiyuan/pipeline/scripts/_mamba.sh

conda activate expansionhunter

ASSEMBLY=$(validate_input ${1,,} hg19 hg38)
INPUT_BAM=$2
OUT_DIR=${3:-.}
SAMPLE_ID=$4

if [ -z "$SAMPLE_ID" ]; then
    echo "Error: sample ID not provided in 3rd param"
    exit 1
fi

if [ -f $OUT_DIR/eh.done ]; then
  echo "Expansionhunter already done for $INPUT_BAM"
  exit 0
fi

mkdir -p $OUT_DIR

CATALOG=/cluster/home/jiyuan/res/RepeatCatalogs/$ASSEMBLY/variant_catalog.json
if [ $ASSEMBLY == "hg19" ]; then
  REF=$(get_ref hs37)
elif [ $ASSEMBLY == "hg38" ]; then
  REF=$(get_ref hg38)
fi

# https://github.com/Illumina/ExpansionHunter/blob/master/docs/03_Usage.md

ExpansionHunter --reads $INPUT_BAM \
                --reference $REF \
                --variant-catalog $CATALOG \
                --output-prefix $OUT_DIR/$SAMPLE_ID

touch $OUT_DIR/eh.done