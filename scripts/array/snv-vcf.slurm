#!/bin/bash
#SBATCH -p normal
#SBATCH --nodes 1
#SBATCH --ntasks 6
#SBATCH --cpus-per-task 2
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=$(validate_input ${2,,} hs37 hg38)
TYPE=$(validate_input ${3^^} WGS WES)
shift;shift;shift;

if [ $TYPE == "WES" ]; then
  BAIT_INTERVALS="--bait-intervals"
fi

conda activate ngs-call

BIOA_WARP="$HOME/alx-bio/scripts/task/bioa-ngs-call.sh"

echo "Preparing intervals"
PARALLEL=$(
  srun -N 1 -n 1 "$BIOA_WARP" "$TMPDIR" snv.interval-split $BAIT_INTERVALS \
    -t 12 -r $ASSEMBLY -o "$SAMPLE_ID/vcf/" -s "$SAMPLE_ID" "$@"
)

echo "Parallel: $PARALLEL"

# if PARALLEL=-1
JOB_HC=$SAMPLE_ID.hap-caller
JOB_MERGE=$SAMPLE_ID.hap-merge
if [ "$PARALLEL" = "-1" ]; then
  echo "Running in single-threaded mode"
  srun -N 1 -n 1 --cpus-per-task 2 --mem=0 -J $JOB_HC "$BIOA_WARP" "$TMPDIR" snv.hap-caller \
     -r $ASSEMBLY -o "$SAMPLE_ID/" -s "$SAMPLE_ID" "$@"
else
  PARALLEL=$((PARALLEL - 1))
  echo "Running in parallel mode: 0-$PARALLEL"
  for i in $(seq 0 $PARALLEL); do
    echo "Running haplotype caller for interval $i"
    # allow sharing resources within the same node
    # it's --exclusive by default
    srun -N 1 -n 1 --oversubscribe --cpus-per-task 2 --mem=0 -J $JOB_HC "$BIOA_WARP" "$TMPDIR" snv.hap-caller \
      -r $ASSEMBLY -o "$SAMPLE_ID/" -s "$SAMPLE_ID" --id $i "$@" &
  done
  wait
  echo "Merging haplotype calls"
  srun -N 1 -n 1 --cpus-per-task 1 --mem=0 -J $JOB_MERGE "$BIOA_WARP" "$TMPDIR" snv.hap-merge \
     -r $ASSEMBLY -o "$SAMPLE_ID/" -s "$SAMPLE_ID" "$@"
fi

echo "vcf Done"
