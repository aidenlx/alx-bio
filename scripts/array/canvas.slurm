#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg38)
INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hg38.bam"

$PIPELINE \
  canvas -r $ASSEMBLY \
  --bam=$INPUT_BAM:proband \
  -o $SAMPLE_ID/canvas
