#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

VCF=$1
FAM=$2
OUTPUT=${3:-./king}

if [ -z "$VCF" ] || [ -z "$FAM" ]; then
  echo "Usage: $0 <input> <ped> [output-prefix]"
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

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

conda activate king
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

FAM_FINAL=$TMPDIR/king.fam.out
plink --vcf "$VCF" --make-bed --out $TMPDIR/king

# update fam file
matrixextend k2 c1-6 "$FAM" k2 "$TMPDIR/king.fam" \
  | cut -f2- > "$FAM_FINAL" \
  || [ $? != 1 ] && echoerr "Error: failed with $?" && exit $?

mkdir -p $(dirname "$OUTPUT")
king -b $TMPDIR/king.bed --fam "$FAM_FINAL" --bim $TMPDIR/king.bim --kinship --prefix "$TMPDIR/kingout"

KIN="$TMPDIR/kingout.kin"
KINFINAL="$OUTPUT.kin"

awk 'BEGIN {
  FS=OFS="\t"  # Set the input and output field separators to tab
}
NR==1 {  # For the header line of the input file
  $3=$3 FS "KinshipCategory"  # Add a header after $3
}
NR>1 {  # For all other lines of the input file
  if ($9 > 0.354) {  
    $3=$3 FS "dup" # duplicate/MZ twin 重复个体或者同卵双胞胎
  } else if ($9 > 0.177) {  # If the kinship coefficient is greater than 0.177
    $3=$3 FS "1st" # 1st-degree (一级亲属) 一个人的父母、子女以及亲兄弟姐妹
  } else if ($9 > 0.0884) {  # If the kinship coefficient is greater than 0.0884
    $3=$3 FS "2nd" # 2nd-degree (二级亲属) 一个人和他的叔、伯、姑、舅、姨、祖父母、外祖父母
  } else if ($9 > 0.0442) {  # If the kinship coefficient is greater than 0.0442
    $3=$3 FS "3rd" # 3rd-degree (三级亲属) 表兄妹或堂兄妹
  } else {  # If the kinship coefficient is less than or equal to 0.0442
    $3=$3 FS "nil" # 无关系
  }
}  # The "1" at the end of the script is a shorthand for "print", which prints the current line with the modifications made above
1' $KIN > $KINFINAL