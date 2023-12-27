#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task=12

# sbatch -J $name-str --array=1-24%4 ../run.slurm */bamfile/*.sort.hg38.bam */str ;

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba
conda activate slivar

VCF=$1
PED=$2

if [ -z "$VCF" ] || [ -z "$PED" ]; then
  echo "Usage: $0 <vcf> <ped> <hg19/hg38> [out_base]"
  exit 1
fi
# check if vcf or ped exists
if [ ! -f "$VCF" ]; then
  echo "VCF file $VCF does not exist"
  exit 1
fi
if [ ! -f "$PED" ]; then
  echo "PED file $PED does not exist"
  exit 1
fi

ASSEMBLY=$(validate_input $3 hg19 hg38)
OUT_BASE=$4
if [ -z $OUT_BASE ]; then
  OUT_BASE=$(sed -r "s/\.+vcf(\.gz)?$//g" <<< $VCF)
else
  # remove trailing dots
  OUT_BASE=$(sed -r "s/\.+$//g" <<< $OUT_BASE)
fi

EXPR_OUT="$OUT_BASE.slivar.$ASSEMBLY.vcf.gz"
CH_OUT="$OUT_BASE.ch.$ASSEMBLY.vcf.gz"
shift; shift; shift; shift

if [ $ASSEMBLY == "hg19" ]; then
  REF=$(get_ref hs37)
  RES_GNOMAD=/cluster/home/jiyuan/res/slivar/gnomad.hg37.zip
elif [ $ASSEMBLY == "hg38" ]; then
  REF=$(get_ref hg38)
  RES_GNOMAD=/cluster/home/jiyuan/res/slivar/gnomad.hg38.genomes.v3.fix.zip
fi

mkdir -p $(dirname $OUT_BASE)
# rm "$OUT_BASE.slivar."* "$OUT_BASE.ch."*

echo --expr--
pslivar expr --processes $THREADS \
  --vcf "$VCF" --ped "$PED" \
  --pass-only \
  --fasta "$REF" \
  -g $RES_GNOMAD \
  --js $HOME/alx-bio/scripts/slivar-functions.js \
  --info 'INFO.impactful && INFO.gnomad_popmax_af < 0.01 && variant.FILTER == "PASS" && variant.ALT[0] != "*"' \
  --family-expr 'denovo:fam.every(segregating_denovo) && !freq_exceed(INFO, 0.001)' \
  --family-expr 'dominant:fam.every(segregating_dominant)' \
  --family-expr 'recessive:fam.every(segregating_recessive)' \
  --family-expr 'x_denovo:(variant.CHROM == "X" || variant.CHROM == "chrX") && fam.every(segregating_denovo_x) && !freq_exceed(INFO, 0.001)' \
  --family-expr 'x_recessive:(variant.CHROM == "X" || variant.CHROM == "chrX") && fam.every(segregating_recessive_x)' \
  --family-expr 'x_dominant:(variant.CHROM == "X" || variant.CHROM == "chrX") && fam.every(segregating_dominant_x)' \
  --trio 'comphet_side:comphet_side(kid, mom, dad) && INFO.gnomad_nhomalt < 10' \
  | bgzip \
  > "$EXPR_OUT"

echo --compound-hets--

slivar compound-hets -v "$EXPR_OUT" \
    --sample-field comphet_side \
    --sample-field denovo \
    -p "$PED" | bgzip > "$CH_OUT"

conda activate snv-final

# EXPR_OUT_SNV="$OUT_BASE.slivar.snv.$ASSEMBLY.vcf.gz"
# EXPR_OUT_INDEL="$OUT_BASE.slivar.indel.$ASSEMBLY.vcf.gz"

# bcftools view -i 'TYPE="snp"' $EXPR_OUT -Oz > $EXPR_OUT_SNV
# bcftools view -i 'TYPE="indel"' $EXPR_OUT -Oz > $EXPR_OUT_INDEL

# bioa snv.extract -r $ASSEMBLY -i $EXPR_OUT_SNV --slivar "$@" &
bioa snv.extract -r $ASSEMBLY -i $EXPR_OUT --slivar "$@" &
bioa snv.extract -r $ASSEMBLY -i $CH_OUT --slivar-ch "$@" &
wait