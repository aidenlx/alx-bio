#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

EXEC_BIN=/cluster/home/jiyuan/res/AutoMap/AutoMap_v1.2.sh

conda activate automap

# if $OUT_DIR/automap.done exists, quit
if [ -f $OUT_DIR/automap.done ]; then
  echo "AutoMap already done for $INPUT_VCF"
  exit 0
fi

ASSEMBLY=$(validate_input $1 hg19 hg38)
INPUT_VCF_GZ=$2
INPUT_VCF=$(mktemp --suffix ".vcf")
trap "rm -f $INPUT_VCF" EXIT
OUT_DIR=${3:-.}

zcat_safe $INPUT_VCF_GZ > $INPUT_VCF

# AutoMap for single individual
# The main script AutoMap_v1.0.sh takes as input a VCF file which needs to contain GT (genotype) and AD (or AO) (allelic depths for the ref and alt alleles) or DP4 (number of high-quality ref-forward bases, ref-reverse, alt-forward and alt-reverse bases) fields for variants. The output is a text file containing the detected ROHs and a pdf file with the ROHs graphical representation. It is called with bash:
# The approximate computation time per sample is 30 seconds for exome and few minutes for genome sequencing data.

$EXEC_BIN \
  --vcf $INPUT_VCF --out $OUT_DIR \
  --genome $ASSEMBLY

touch $OUT_DIR/automap.done

# AutoMap for multiple individuals
# The same script AutoMap_v1.0.sh can be used to compute ROHs for a list of individuals. VCFs files must be specified in --vcf option separated with commas.

# bash AutoMap_v1.0.sh --vcf VCF1,VCF2,VCF3 --out output_directory --genome [hg19|hg38] [other options]
# Ids can be specified through --id option also separated with commas. If IDs are not specified, they will be taken from VCF files directly.

# bash AutoMap_v1.0.sh --vcf VCF1,VCF2,VCF3 --id ID1,ID2,ID3 --out output_directory --genome [hg19|hg38] [other options]

