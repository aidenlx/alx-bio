#!/bin/bash
#SBATCH --cpus-per-task=16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
THREADS=${SLURM_CPUS_PER_TASK:-8}

TAG="2.2.9"

# check if becklab/pav:2.2.9 loaded
if ! docker image inspect becklab/pav:${TAG} &>/dev/null; then
  zcat /cluster/home/jiyuan/res/pav/pav-${TAG}.tar.gz | docker load
fi

docker run --rm \
  -v ${PWD}:${PWD} --user "$(id -u):$(id -g)" \
  --workdir ${PWD} becklab/pav:${TAG} -c ${THREADS} "$@"