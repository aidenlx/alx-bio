#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hs37 hg38)
shift;shift;

conda activate "hs37-WES"
$PIPELINE \
  "snv.align" --fq1 "$FASTQ1" --fq2 "$FASTQ2" \
  -t $THREADS -r $ASSEMBLY -o "$SAMPLE_ID/" -s "$SAMPLE_ID" "$@"
