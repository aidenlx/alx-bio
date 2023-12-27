#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

conda activate merlin

bioa merlin "$@"
