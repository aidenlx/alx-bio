#!/bin/bash

source $HOME/alx-bio/scripts/_base.sh

FILELIST=$1

if [ -z "$FILELIST" ]; then
    echo "Usage: $0 <filelist> ..."
    exit 1
fi

DETAILS=$(awk '$1 == '${SLURM_ARRAY_TASK_ID:-1}' {print}' $FILELIST)

if [ -z "$DETAILS" ]; then
    echo "Error: No details found for task ${SLURM_ARRAY_TASK_ID:-1}"
    exit 1
fi

SAMPLE_ID=$(echo "$DETAILS" | cut -f 2)
FASTQ1=$(echo "$DETAILS" | cut -f 3)
FASTQ2=$(echo "$DETAILS" | cut -f 4)

if [ -z "$SAMPLE_ID" ]; then
    echo "Error: Invalid sample id found for task ${SLURM_ARRAY_TASK_ID:-1}"
    exit 1
fi

export TMPDIR=$(mktemp -d --tmpdir=./$SAMPLE_ID/)
export TMPDIR=$(realpath $TMPDIR)

trap 'rm -rf -- "$TMPDIR"' EXIT