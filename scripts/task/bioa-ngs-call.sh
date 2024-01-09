#!/bin/bash
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

export TMPDIR=$1
shift;
conda activate ngs-call

bioa "$@"