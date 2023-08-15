#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 6

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

# mamba create -y -c conda-forge -c bioconda -n cadd-initial ripgrep tabix snakemake    
conda activate cadd-initial

PATH=/cluster/home/jiyuan/res/CADD-scripts:$PATH

ASSEMBLY=$(validate_input $1 hg19 hg38)
SRC_VCF=$2
OUTPUT=$3

[ ! -f "$SRC_VCF" ] && echo "file not found: $SRC_VCF" && exit 1

INPUT_VCF=$(mktemp --suffix .vcf.gz)
trap "rm -f $INPUT_VCF" EXIT

# only allow variants on autosomes, chrX, chrY
FILTER='^([1-9]|1[0-9]|2[0-2]|[XY])\t|^#'

if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY_CADD="GRCh37"
  # exclude those variants not in CADD
  zcat_safe $SRC_VCF | rg $FILTER | bgzip > $INPUT_VCF
elif [ $ASSEMBLY == "hg38" ]; then
  ASSEMBLY_CADD="GRCh38"
  # INPUT_VCF="$SAMPLE_ID.norm.hg38.no-chr.vcf.gz"
  zcat_safe $SRC_VCF | sed 's/^chr//' | rg $FILTER | bgzip > $INPUT_VCF
fi

CADD.sh -g $ASSEMBLY_CADD -o "$OUTPUT" -c $SLURM_CPUS_PER_TASK $INPUT_VCF

echo indexing "$OUTPUT"
tabix -b 2 -e 2 "$OUTPUT"

echo spent $SECONDS