#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
if [ $ASSEMBLY == "hg19" ]; then
  INPUT_VCF="$SAMPLE_ID/vcf/$SAMPLE_ID.raw.hs37.vcf.gz"
elif [ $ASSEMBLY == "hg38" ]; then
  INPUT_VCF="$SAMPLE_ID/vcf/$SAMPLE_ID.raw.hg38.vcf.gz"
fi

OUT_DIR=$SAMPLE_ID/automap

bash /genetics/home/stu_liujiyuan/pipeline/scripts/task/automap.sh \
  $ASSEMBLY $INPUT_VCF $OUT_DIR