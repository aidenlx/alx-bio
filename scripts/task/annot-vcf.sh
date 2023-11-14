#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 12
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

INPUT_VCF=$1
ASSEMBLY=$(validate_input $2 hg19 hg38)
SAMPLE_ID=$3

if [ -z "$SAMPLE_ID" ]; then
  echo "Usage: $0 <input> <assembly (hg19/hg38)> <sample_id>"
  exit 1
fi

export PATH=/cluster/home/jiyuan/res/annovar:$PATH
conda activate snv-final

cd $(dirname "$INPUT_VCF")
INPUT_VCF=$(basename "$INPUT_VCF")

if [ $ASSEMBLY == "hg19" ]; then
  NORM_VCF="$SAMPLE_ID.norm.v2.hs37.vcf"
elif [ $ASSEMBLY == "hg38" ]; then
  NORM_VCF="$SAMPLE_ID.norm.v2.hg38.vcf"
fi

bcftools norm -m -both "$INPUT_VCF" -o "$NORM_VCF"

/genetics/home/stu_liujiyuan/.local/bin/bioa snv.annot.s -r $ASSEMBLY \
  -i "$NORM_VCF" -s "$SAMPLE_ID" --no-stats

/genetics/home/stu_liujiyuan/.local/bin/bioa snv.annot.m -t $THREADS -r $ASSEMBLY  --normed \
  -i "$SAMPLE_ID.s.v2.$ASSEMBLY.vcf" -s "$SAMPLE_ID"

/genetics/home/stu_liujiyuan/.local/bin/bioa snv.final -r $ASSEMBLY -s "$SAMPLE_ID" --no-cadd-script