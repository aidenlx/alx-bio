#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
shift;shift

conda activate snpeff-java

cd "$SAMPLE_ID/vcf"

bioa snv.final -r $ASSEMBLY -s "$SAMPLE_ID" "$@"