#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task=16
#SBATCH --mem-per-cpu=5G
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

conda activate 3gs-call

bioa 3gs.map -p ont -t $THREADS \
  -o $SAMPLE_ID/ -s $SAMPLE_ID --fq $FASTQ1

