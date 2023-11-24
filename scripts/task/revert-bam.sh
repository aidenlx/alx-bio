#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 6
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

conda activate ngs-call

samtools collate -uO "$1" \
  | samtools bam2fq -s ./s.fq.gz -1 ./1.fq.gz -2 ./2.fq.gz
