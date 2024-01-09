#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 12
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

ASSEMBLY=hg19
SAMPLE_ID=$1

if [ -z "$SAMPLE_ID" ]; then
  echo "Usage: $0 <sample-id>"
  exit 1
fi

conda activate snv-final
bioa snv.annot.m -t $THREADS -r $ASSEMBLY --normed --no-local \
  -i "$SAMPLE_ID.s.v2.$ASSEMBLY.vcf.gz" -s "$SAMPLE_ID"