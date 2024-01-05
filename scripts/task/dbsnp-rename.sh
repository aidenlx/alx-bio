#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 3

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

conda activate snv-final

HG19_RENAME=GCF_000001405.25_GRCh37.p13_assembly_report.chrnames
HG38_RENAME=GCF_000001405.40_GRCh38.p14_assembly_report.chrnames

DBSNP_HG19=GCF_000001405.25.gz
DBSNP_HG38=GCF_000001405.40.gz

if [ ! -f "$HG19_RENAME" ] || [ ! -f "$HG38_RENAME" ]; then
  echo "Error: missing assembly reports $HG19_RENAME or $HG38_RENAME"
  exit 1
fi
if [ ! -f "$DBSNP_HG19" ] || [ ! -f "$DBSNP_HG38" ]; then
  echo "Error: missing dbsnp file $DBSNP_HG19 or $DBSNP_HG38"
  exit 1
fi

VER=$1
if [ -z $VER ]; then
  echo "Error: missing VER"
  exit 1
fi


# Annotate
echo RENAMING hg19 && \
bcftools annotate \
  --rename-chrs "$HG19_RENAME" \
  --threads 10 -Oz \
  -o dbsnp$VER.hg19.vcf.gz \
  "$DBSNP_HG19" && tabix dbsnp$VER.hg19.vcf.gz && \
  echo hg19 DONE  &

echo RENAMING hg38 && \
bcftools annotate \
  --rename-chrs "$HG38_RENAME" \
  --threads 10 -Oz \
  -o dbsnp$VER.hg38.vcf.gz \
  "$DBSNP_HG38" && tabix dbsnp$VER.hg38.vcf.gz && \
  echo hg38 DONE  &

echo RENAMING hs37 && \
bcftools annotate \
  --rename-chrs <(sed 's/chr//' "$HG19_RENAME") \
  --threads 10 -Oz \
  -o dbsnp$VER.hs37.vcf.gz \
  "$DBSNP_HG19" && tabix dbsnp$VER.hs37.vcf.gz && \
  echo hs37 DONE  &

wait

echo all done