#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 16
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

# set MERGED htq-fam; sbatch --dependency=afterok:$JOB_ID -J $MERGED.merge \
#   ~/pipeline/scripts/task/snv-merge.sh \
#   -o $MERGED/vcf/$MERGED. -r $ASSEMBLY \
#   $(cut -f 2 file.txt | xargs -I _ printf "%s/vcf/%s.g.$ASSEMBLY.vcf.gz " _ _) \
# && printf "1\t$MERGED" > fam.txt

source /genetics/home/stu_liujiyuan/pipeline/scripts/_base.sh
conda_init mamba

conda activate ngs-call
$PIPELINE \
  "snv.merge" "$@"
