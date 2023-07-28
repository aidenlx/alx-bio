#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task=3

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh

conda activate annotsv

RUN_DIR=$2
ASSEMBLY=$(validate_input ${1,,} hg19 hg38)
if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY=GRCh37
elif [ $ASSEMBLY == "hg38" ]; then
  ASSEMBLY=GRCh38
fi

cd $RUN_DIR/results/variants

function fixSVALT () {
  awk -F '\t' 'BEGIN {OFS="\t"} {split($8, info, ";"); for (i in info) {if (info[i] ~ /^SVTYPE=/) {split(info[i], svtype, "="); $5="<"svtype[2]">"}}; print}'
}

# fix badly formatted vcf
function addFILTER () {
  awk -F '\t' 'BEGIN {OFS="\t"} { if (substr($0, 1, 2) == "##") { print $0 } else if ($1 == "#CHROM") { print $0, "FORMAT" } else { print $0, "" } }'
}

function annot () {
  AnnotSV -SVinputFile $1 -outputFile $(basename $1 .raw.vcf) -genomeBuild $ASSEMBLY
}

echo 'fixing SV vcf...'
zcat diploidSV.vcf.gz | fixSVALT > diploidSV.raw.vcf &
zcat candidateSV.vcf.gz | addFILTER | fixSVALT  > candidateSV.raw.vcf &
zcat candidateSmallIndels.vcf.gz | addFILTER | fixSVALT > candidateSmallIndels.raw.vcf &
wait

echo 'annotating...'
annot diploidSV.raw.vcf &
annot candidateSV.raw.vcf &
annot candidateSmallIndels.raw.vcf &
wait

echo "done"



