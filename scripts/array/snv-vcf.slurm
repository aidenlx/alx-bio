#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=$(validate_input ${2,,} hs37 hg38)
TYPE=$(validate_input ${3^^} WGS WES)
shift;shift;shift;

if [ $TYPE == "WES" ]; then
  BAIT_INTERVALS="--bait-intervals"
fi

conda activate ngs-call
$PIPELINE \
  "snv.vcf" $BAIT_INTERVALS \
  -t $THREADS -r $ASSEMBLY -o "$SAMPLE_ID/" -s "$SAMPLE_ID" "$@"
