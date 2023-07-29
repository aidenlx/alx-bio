#!/bin/bash

# set -eo pipefail

source /genetics/home/stu_liujiyuan/pipeline/scripts/_mamba.sh

THREADS=${SLURM_CPUS_PER_TASK:-8}

eval "$($CONDA_EXE shell.bash hook)"

conda activate SQANTI3.env

# if /genetics/home/stu_liujiyuan/cDNA_Cupcake/sequence/ not in PYTHONPATH, append it
if [[ ! $PYTHONPATH =~ /genetics/home/stu_liujiyuan/cDNA_Cupcake/sequence/ ]]; then
  export PYTHONPATH=$PYTHONPATH:/genetics/home/stu_liujiyuan/cDNA_Cupcake/sequence/
fi

SQANTI3_PREFIX=/genetics/home/stu_liujiyuan/SQANTI3-5.1.2/

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

printf "${BLUE}SQANTI3 Environment activated${NC}\n"
printf "Example usage: ${GREEN}python \$SQANTI3_PREFIX/sqanti3_qc.py${NC}\n"