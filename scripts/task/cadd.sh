#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 6

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh

PATH=/cluster/home/jiyuan/res/CADD-scripts:$PATH

ASSEMBLY=$(validate_input $1 hg19 hg38)
SAMPLE_ID=$2

# only allow variants on autosomes, chrX, chrY
FILTER='^([1-9]|1[0-9]|2[0-2]|[XY])\t|^#'

if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY_CADD="GRCh37"
  SRC_VCF="$SAMPLE_ID.norm.hs37.vcf"
  INPUT_VCF="$SAMPLE_ID.norm.hs37.no-chr.vcf"
  # exclude those variants not in CADD
  rg $FILTER $SRC_VCF > $INPUT_VCF
elif [ $ASSEMBLY == "hg38" ]; then
  ASSEMBLY_CADD="GRCh38"
  SRC_VCF="$SAMPLE_ID.norm.hg38.vcf"
  INPUT_VCF="$SAMPLE_ID.norm.hg38.no-chr.vcf"
  sed 's/^chr//' $SRC_VCF | rg $FILTER > $INPUT_VCF
fi

OUTPUT=$SAMPLE_ID.cadd.$ASSEMBLY.tsv.gz

CADD.sh -g $ASSEMBLY_CADD -o "$OUTPUT" -c $SLURM_CPUS_PER_TASK $INPUT_VCF

conda activate hs37-WES

echo indexing "$OUTPUT"
tabix -b 2 -e 2 "$OUTPUT"

echo spent $SECONDS