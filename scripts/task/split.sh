#!/bin/bash
#SBATCH --cpus-per-task=4

source $HOME/alx-bio/scripts/_base.sh
conda_init mamba

conda activate snv-final

export INPUT=$1
ASSEMBLY=$(validate_input ${2,,} hs37 hg38)
export OUTPUT=$3

if [ -z "$ALXBIO_RES"] ; then
  ALXBIO_RES="/cluster/home/jiyuan/res"
fi

if [ -z "$INPUT" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: $0 <input> <assembly (hs37/hg38)> <output_name>"
  exit 1
fi

if [ $ASSEMBLY == "hs37" ]; then
  export PREFIX=""
  MT="MT"
elif [ $ASSEMBLY == "hg38" ]; then
  export PREFIX="chr"
  MT="M"
fi

echo -n {1..22} X Y $MT | tr ' ' '\n' | xargs -I % -P 4 bash -c 'c="%"
echo "Processing chr$c"
OUTPUT_EACH=$(sed "s/%c/chr$c/g" <<< $OUTPUT)
bcftools view -r $PREFIX$c "$INPUT" -o "$OUTPUT_EACH" && tabix -f "$OUTPUT_EACH"'