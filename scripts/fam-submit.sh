#!/bin/bash

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh

[ ! -f "file.txt" ] && echo "file.txt not found" && exit 1
[ ! -f "fam.txt" ] && echo "fam.txt not found" && exit 1
NAME=$(head -n1 fam.txt | cut -f2)

ASSEMBLY=$(validate_input $1 hg19 hg38)
ARRAY=${2:-%4}
shift;shift

GVCFS=$(bioa pl.fam-check -r $ASSEMBLY file.txt)

BEFORE_MERGE=$(bioa pl.submit --parsable -J $NAME --pick -vcf -r $ASSEMBLY -a $ARRAY $@ file.txt)
MERGE=$(sbatch --parsable -J $NAME.merge \
  --dependency=afterok:$(tail -n1 <<< "$BEFORE_MERGE") \
  /genetics/home/stu_liujiyuan/pipeline/scripts/task/snv-merge.sh \
  -o $NAME/vcf/$NAME. -r $ASSEMBLY $GVCFS)
echo ---
echo merging:
echo "$GVCFS"
echo ---
AFTER_MERGE=$(bioa pl.submit --parsable -J $NAME --pick cadd- --dependency=afterok:$MERGE -r $ASSEMBLY $@ fam.txt)

# log all job ids
echo $BEFORE_MERGE $MERGE $AFTER_MERGE

