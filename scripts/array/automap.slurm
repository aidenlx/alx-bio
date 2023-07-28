#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
if [ $ASSEMBLY == "hg19" ]; then
  REF=$(get_ref hs37)
  INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hs37.bam"
elif [ $ASSEMBLY == "hg38" ]; then
  REF=$(get_ref hg38)
  INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hg38.bam"
fi

OUT_DIR=$SAMPLE_ID/expansionhunter

bash /genetics/home/stu_liujiyuan/pipeline/scripts/task/expansionhunter.sh \
  $ASSEMBLY $INPUT_BAM $OUT_DIR