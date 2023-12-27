#!/bin/bash

source $HOME/alx-bio/scripts/_base.sh

[ ! -f "file.txt" ] && echo "file.txt not found" && exit 1
[ ! -f "fam.txt" ] && echo "fam.txt not found" && exit 1
NAME=$(head -n1 fam.txt | cut -f2)

ASSEMBLY=$(validate_input $1 hg19 hg38)
ASSEMBLY_MERGE=$ASSEMBLY
if [ $ASSEMBLY == "hg19" ]; then
  ASSEMBLY_MERGE=hs37
fi
ARRAY=${2:-%4}
shift;shift

GVCFS=$(bioa pl.fam-check -r $ASSEMBLY_MERGE file.txt)

BEFORE_MERGE=$(bioa pl.submit --parsable -J $NAME --pick -vcf -r $ASSEMBLY -a $ARRAY $@ file.txt)
MERGE=$(sbatch --parsable -J $NAME.merge \
  --dependency=afterok:$(tail -n1 <<< "$BEFORE_MERGE") \
  $HOME/alx-bio/scripts/task/snv-merge.sh \
  -o $NAME/vcf/$NAME. -r $ASSEMBLY_MERGE $GVCFS)
echo ---
echo merging:
echo "$GVCFS"
echo ---
AFTER_MERGE=$(bioa pl.submit --parsable -J $NAME --pick cadd- --dependency=afterok:$MERGE -r $ASSEMBLY $@ fam.txt)

# log all job ids
echo $BEFORE_MERGE $MERGE $AFTER_MERGE

