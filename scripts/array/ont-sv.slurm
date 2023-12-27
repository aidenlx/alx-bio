#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task=16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init conda

INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.sort.hg38.bam"

conda activate svision
bioa sv.call -t $THREADS -o $SAMPLE_ID/ -s $SAMPLE_ID --ref hg38 \
  --bam $INPUT_BAM

conda activate annotsv
bioa sv.annot -o $SAMPLE_ID/ -s $SAMPLE_ID --ref hg38 \
  --vcf $SAMPLE_ID/svision/$SAMPLE_ID.annotsv.vcf
