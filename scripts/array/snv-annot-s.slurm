#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
shift;shift

if [ $ASSEMBLY == "hg19" ]; then
  INPUT_VCF="$SAMPLE_ID.norm.hs37.vcf"
elif [ $ASSEMBLY == "hg38" ]; then
  INPUT_VCF="$SAMPLE_ID.norm.hg38.vcf"
fi

export PATH=/cluster/home/jiyuan/res/annovar:$PATH
conda activate snpeff-java
bioa snv.annot.s -r $ASSEMBLY \
  -i "$SAMPLE_ID/vcf/$INPUT_VCF" -s "$SAMPLE_ID" "$@"