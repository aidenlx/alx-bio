#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

conda activate merlin

bioa merlin "$@"
