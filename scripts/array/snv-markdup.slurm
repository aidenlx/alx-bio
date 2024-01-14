#!/bin/bash
#SBATCH -p scpu-p1
#SBATCH -N 1
#SBATCH --cpus-per-task 20
#SBATCH --mem=0
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=$(validate_input ${2,,} hs37 hg38)
shift;shift;

conda activate ngs-call
bioa snv.markdup \
  -t $THREADS -r $ASSEMBLY -o "$SAMPLE_ID/" -s "$SAMPLE_ID" "$@"



