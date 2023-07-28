#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
if [ $ASSEMBLY == "hg19" ]; then
  INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hs37.bam"
elif [ $ASSEMBLY == "hg38" ]; then
  INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hg38.bam"
fi

OUT_DIR=$SAMPLE_ID/manta

bash /genetics/home/stu_liujiyuan/pipeline/scripts/task/manta-cfg.sh \
  $ASSEMBLY $INPUT_BAM $OUT_DIR

bash /genetics/home/stu_liujiyuan/pipeline/scripts/task/manta-run.sh \
  $OUT_DIR

bash /genetics/home/stu_liujiyuan/pipeline/scripts/task/manta-annot.sh \
  $ASSEMBLY $OUT_DIR