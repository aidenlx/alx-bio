#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task=16

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
source /genetics/home/stu_liujiyuan/pipeline/scripts/_mamba.sh

conda activate manta

RUN_DIR=$1

HASH=$(md5sum $RUN_DIR/runWorkflow.py | awk '{print $RUN_DIR}')

# $RUN_DIR/manta.done includes md5 hash for $RUN_DIR/runWorkflow.py, if the done file exists and the hash matches, then exit
if [ -f $RUN_DIR/manta.done ]; then
  if [ "$HASH" == "$(cat $RUN_DIR/manta.done)" ]; then
    echo "Manta already done for $RUN_DIR"
    exit 0
  fi
fi

$RUN_DIR/runWorkflow.py \
  -j $THREADS && echo "$HASH" > $RUN_DIR/manta.done