#!/bin/bash
#SBATCH -p AI
#SBATCH --gpus-per-node 2
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/array/_base.sh

ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
if [ $ASSEMBLY == "hg19" ]; then
  INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hs37.bam"
elif [ $ASSEMBLY == "hg38" ]; then
  INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hg38.bam"
fi

conda activate cue
$PIPELINE \
  cue -o $SAMPLE_ID/cue -r $ASSEMBLY --bam $INPUT_BAM

conda activate annotsv
if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY=GRCh37
elif [ $ASSEMBLY == "hg38" ]; then
  ASSEMBLY=GRCh38
fi

cd $SAMPLE_ID/cue/reports

echo 'annotating SVs...'
AnnotSV -SVinputFile svs.vcf -outputFile svs -genomeBuild $ASSEMBLY &
AnnotSV -SVinputFile candidate_svs.bed -outputFile candidate_svs -svtBEDcol 7 -genomeBuild $ASSEMBLY &
AnnotSV -SVinputFile refined_svs.bed -outputFile refined_svs -svtBEDcol 7 -genomeBuild $ASSEMBLY &
wait