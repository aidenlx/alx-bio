#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 6
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)

cd $SAMPLE_ID/vcf

if [ $ASSEMBLY == "hg19" ]; then
  INPUT_VCF="$SAMPLE_ID.norm.v2.hs37.vcf.gz"
elif [ $ASSEMBLY == "hg38" ]; then
  INPUT_VCF="$SAMPLE_ID.norm.v2.hg38.vcf.gz"
fi

OUTPUT=$SAMPLE_ID.cadd.v2.$ASSEMBLY.tsv.gz

bash /genetics/home/stu_liujiyuan/pipeline/scripts/task/cadd.sh $ASSEMBLY $INPUT_VCF $OUTPUT