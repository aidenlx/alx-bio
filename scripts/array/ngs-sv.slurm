#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task=16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg38)
INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.$ASSEMBLY.bam"

conda activate svision
$PIPELINE \
  sv.call -t $THREADS -o $SAMPLE_ID/ -s $SAMPLE_ID \
  --bam $INPUT_BAM

conda activate annotsv
$PIPELINE \
  sv.annot -t $THREADS -o $SAMPLE_ID/ -s $SAMPLE_ID \
  --vcf $SAMPLE_ID/svision/$SAMPLE_ID.annotsv.vcf
