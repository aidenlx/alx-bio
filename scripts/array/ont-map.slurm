#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task=16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh
conda_init conda

eval "$(conda shell.bash hook)"
conda activate /cluster/home/jiyuan/mambaforge/envs/ont-map

$PIPELINE \
  ont.map -t $THREADS -o $SAMPLE_ID/ -s $SAMPLE_ID \
  --fq $FASTQ1

