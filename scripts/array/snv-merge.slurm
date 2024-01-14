#!/bin/bash
#SBATCH -p scpu-p1
#SBATCH -N 1
#SBATCH --mem=0
#SBATCH --cpus-per-task 16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=$(validate_input ${2,,} hs37 hg38)
shift;shift;

conda activate ngs-call
bioa snv.merge -o "$SAMPLE_ID/vcf/$SAMPLE_ID." -r $ASSEMBLY \
  "$SAMPLE_ID/vcf/$SAMPLE_ID.g.$ASSEMBLY.vcf.gz" "$@"
