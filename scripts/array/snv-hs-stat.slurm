#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=${2,,}
shift;shift

conda activate ngs-call

MARKDUP=$SAMPLE_ID/bamfile/$SAMPLE_ID.markdup.$ASSEMBLY.bam
BQSR=$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.$ASSEMBLY.bam

if [ -f $MARKDUP ]; then
  INPUT_BAM=$MARKDUP
elif [ -f $BQSR ]; then
  INPUT_BAM=$BQSR
else
  echo "Error: No input bam found for sample $SAMPLE_ID"
  echo "Expect: $MARKDUP or $BQSR"
  exit 1
fi

bioa snv.hs-stat -r $ASSEMBLY $INPUT_BAM "$@"