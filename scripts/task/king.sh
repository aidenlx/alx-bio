#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

VCF=$1
FAM=$2
OUTPUT=${3:-./king}

if [ -z "$VCF" ] || [ -z "$FAM" ]; then
  echo "Usage: $0 <input> <output>"
  exit 1
fi

if [ ! -f "$VCF" ]; then
  echo "Input file not found: $VCF"
  exit 1
fi
if [ ! -f "$FAM" ]; then
  echo "fam file not found: $FAM"
  exit 1
fi

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

conda activate king
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

plink --vcf "$VCF" --make-bed --out $TMPDIR/king
cp -f "$FAM" $TMPDIR/king.fam

mkdir -p $(dirname "$OUTPUT")
king -b $TMPDIR/king.bed --fam $TMPDIR/king.fam --bim $TMPDIR/king.bim --related --prefix "$OUTPUT"
# king -b lyx-g.king.bed --fam lyx-g.king.fam --bim lyx-g.king.bim --kinship