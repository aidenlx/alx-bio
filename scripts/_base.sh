#!/bin/bash

# prevent multiple sourcing
if [ -n "$_ALX_BASE_CONFIGED" ]; then
  return
fi
_ALX_BASE_CONFIGED=1

set -eo pipefail

function conda_init() {
  # for fjsc
  if [ -x "$(command -v micromamba)" ]; then
    shopt -s expand_aliases
    source "$HOME/.bashrc"
    alias conda="$(which micromamba) $@"
    return
  fi
  if [ $1 == "conda" ]; then
    export CONDA_EXE=/genetics/home/stu_liujiyuan/miniconda3/bin/conda
    export CONDA_PREFIX=/genetics/home/stu_liujiyuan/miniconda3
  elif [ $1 == "mamba" ]; then
    export CONDA_PREFIX=/cluster/home/jiyuan/mambaforge
    export MAMBA_EXE=/cluster/home/jiyuan/mambaforge/bin/mamba
    export CONDA_EXE=/cluster/home/jiyuan/mambaforge/bin/conda
  else
    echo "Error: CONDA env should be conda or mamba, got $1"
    exit 1
  fi
  eval "$($CONDA_EXE shell.bash hook)"
}

THREADS=${SLURM_CPUS_PER_TASK:-8}

echoerr() { echo "$@" 1>&2; }

function validate_input () {
  INPUT=$1
  if [ -z "$INPUT" ]; then
    echoerr "Error: missing INPUT"
    exit 1
  fi
  # read args from $2, check if $INPUT matches any of them
  shift
  ALLOWED=( "$@" )
  for i in "${ALLOWED[@]}"; do
    if [ "$INPUT" == "$i" ]; then
      echo $INPUT
      return
    fi
  done

  echoerr "Error: arg should be $@, got $INPUT"
  exit 1
}

function get_ref () {
  ASSEMBLY=$1
  if [ -z "$ASSEMBLY" ]; then
    echoerr "Error: missing ASSEMBLY"
    exit 1
  elif [ $ASSEMBLY == "hs37" ]; then
    echo /cluster/home/jiyuan/res/hg19/hs37d5.fa
  elif [ $ASSEMBLY == "hg38" ]; then
    echo /cluster/home/jiyuan/res/hg38/GCA_000001405.15_GRCh38_no_alt_analysis_set.fa
  else 
    echoerr "Error: ASSEMBLY should be hs37 or hg38, got $ASSEMBLY"
    exit 1
  fi
}

function zcat_safe() {
  # if $1 ends with .gz, then zcat $1
  if [[ ! $1 =~ \.gz$ ]]; then
    echoerr "Error: $1 is not a gzipped file"
    exit 1
  fi

  [[ -f ${1%.gz} ]] && echoerr bgziping ${1%.gz} && bgzip ${1%.gz}
  zcat < $1
}