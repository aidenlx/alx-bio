#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 12
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

ASSEMBLY=hg19
SAMPLE_ID=$1

if [ -z "$SAMPLE_ID" ]; then
  echo "Usage: $0 <sample-id>"
  exit 1
fi

export PATH=/cluster/home/jiyuan/res/annovar:$PATH
conda activate snv-final

cd /cluster/home/jiyuan/res/fjmun/

bioa snv.annot.s -r $ASSEMBLY --normed \
  -i "$SAMPLE_ID.$ASSEMBLY.vcf.gz" -s "$SAMPLE_ID" --no-stats

bioa snv.annot.m -t $THREADS -r $ASSEMBLY --normed --no-local \
  -i "$SAMPLE_ID.s.v2.$ASSEMBLY.vcf.gz" -s "$SAMPLE_ID"