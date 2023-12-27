#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh

CATALOG=/cluster/home/jiyuan/res/str-analysis/str_analysis/variant_catalogs
ASSEMBLY=$(validate_input ${2,,} hg19 hg38)
if [ $ASSEMBLY == "hg19" ]; then
  INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hs37.bam"
  CATALOG=$CATALOG/variant_catalog_without_offtargets.GRCh37.json
elif [ $ASSEMBLY == "hg38" ]; then
  INPUT_BAM="$SAMPLE_ID/bamfile/$SAMPLE_ID.bqsr.hg38.bam"
  CATALOG=$CATALOG/variant_catalog_without_offtargets.GRCh38.json
fi

OUT_DIR=$SAMPLE_ID/expansionhunter

# https://stripy.org/expansionhunter-catalog-creator

bash $HOME/alx-bio/scripts/task/expansionhunter.sh \
  $ASSEMBLY "$INPUT_BAM" "$OUT_DIR" "$SAMPLE_ID" \
  "$CATALOG"