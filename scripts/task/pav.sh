#!/bin/bash
#SBATCH --cpus-per-task=16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/_base.sh
THREADS=${SLURM_CPUS_PER_TASK:-8}

TAG="2.2.9"
RES_DIR=/cluster/home/jiyuan/res

# check if becklab/pav:2.2.9 loaded
if ! docker image inspect becklab/pav:${TAG} &>/dev/null; then
  zcat "$RES_DIR/pav/pav-${TAG}.tar.gz" | docker load
fi

docker run --rm \
  -v ${RES_DIR}:${RES_DIR}:ro -v ${PWD}:${PWD} \
  --user "$(id -u):$(id -g)" \
  --workdir ${PWD} becklab/pav:${TAG} -c ${THREADS} "$@"