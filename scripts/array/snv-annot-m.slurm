#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 12
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
shift;shift

export PATH=/cluster/home/jiyuan/res/annovar:$PATH
conda activate snv-final
bioa snv.annot.m -t $THREADS -r $ASSEMBLY --normed \
  -i "$SAMPLE_ID/vcf/$SAMPLE_ID.s.v2.$ASSEMBLY.vcf" -s "$SAMPLE_ID" "$@"
