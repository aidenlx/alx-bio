#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 4
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
shift;shift

conda activate snv-final

cd "$SAMPLE_ID/vcf"

bioa snv.final -r $ASSEMBLY -s "$SAMPLE_ID" "$@"