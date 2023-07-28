#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 6
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)

cd $SAMPLE_ID/vcf

bash /genetics/home/stu_liujiyuan/pipeline/scripts/task/cadd.sh $ASSEMBLY $SAMPLE_ID