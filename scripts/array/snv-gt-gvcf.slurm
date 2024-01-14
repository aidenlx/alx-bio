#!/bin/bash
#SBATCH -p normal
#SBATCH --nodes 1
#SBATCH --ntasks 10
#SBATCH --cpus-per-task 2
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=$(validate_input ${2,,} hs37 hg38)
shift;shift;

intervals=("1" "2" "3" "4" "5" "6" "7" "8" "9" "10" "11" "12,13" "14,15" "16,17,18" "19,20,21,22" "X,Y")
if [ "$ASSEMBLY" == "hs37" ]; then
  prefix=""
else 
  prefix="chr"
fi
generate_intervals() {
  local i=$1
  tr ',' '\n' <<< "${intervals[i]}" | xargs -I% echo "$prefix"%
}

conda activate ngs-call
BIOA_WARP="$HOME/alx-bio/scripts/task/bioa-ngs-call.sh"

JOB_GG=$SAMPLE_ID.gt-gvcf
JOB_GM=$SAMPLE_ID.gt-merge
JOB_NV=$SAMPLE_ID.norm-vcf

INTERVALS_DIR=$SAMPLE_ID/vcf/.intervals
RAW_DIR=$SAMPLE_ID/vcf/.raw
mkdir -p "$INTERVALS_DIR"
mkdir -p "$RAW_DIR"
for i in "${!intervals[@]}"; do
  echo "Running haplotype caller for interval $i"
  INTERVAL="$INTERVALS_DIR/seg_$i.list"
  generate_intervals $i > "$INTERVAL"
  # allow sharing resources within the same node
  # it's --exclusive by default
  srun -N 1 -n 1 --oversubscribe --cpus-per-task 2 --mem=0 -J $JOB_GG "$BIOA_WARP" "$TMPDIR" snv.gt-gvcf \
    -r $ASSEMBLY -L "$INTERVAL" \
    -i "$SAMPLE_ID/vcf/$SAMPLE_ID.g.$ASSEMBLY.vcf.gz" \
    -o "$RAW_DIR/$SAMPLE_ID.raw.$i.$ASSEMBLY.vcf.gz" "$@" &
done
wait

files=$(for i in "${!intervals[@]}"; do echo "$RAW_DIR/$SAMPLE_ID.raw.$i.$ASSEMBLY.vcf.gz"; done)
echo "Merging segments: $files"
srun -N 1 -n 1 --cpus-per-task 1 --mem=0 -J $JOB_GM "$BIOA_WARP" "$TMPDIR" snv.gt-merge \
  -o $SAMPLE_ID/vcf/$SAMPLE_ID.raw.$ASSEMBLY.vcf.gz $files

echo "Normalizing vcf"
srun -N 1 -n 1 --cpus-per-task 1 --mem=0 -J $JOB_NV "$BIOA_WARP" "$TMPDIR" snv.norm-vcf \
  -r $ASSEMBLY -o $SAMPLE_ID/ -s $SAMPLE_ID