#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task 16
#SBATCH --mem-per-cpu=4G
#SBATCH --output=log-%A-%x_%a.out
#SBATCH --error=log-%A-%x_%a.err

# > bwa-mem2 pre-allocates some memory upfront to be used during the execution;
# It does reallocation if the allocated memory falls short. 
# Memory usage is directly proportional to the number of threads used. 
# In practice, the memory usage can range from a few hundred MBs to ~4 GB per thread.

source $HOME/alx-bio/scripts/array/_base.sh
conda_init mamba

ASSEMBLY=$(validate_input ${2,,} hs37 hg38)
shift;shift;

conda activate ngs-call
# if missing $FASTQ1 or $FASTQ2
if [ -z $FASTQ1 ] || [ -z $FASTQ2 ]; then
  bioa snv.align \
    -t $THREADS -r $ASSEMBLY -o "$SAMPLE_ID/" -s "$SAMPLE_ID" "$@"
else
  bioa snv.align --fq1 "$FASTQ1" --fq2 "$FASTQ2" \
  -t $THREADS -r $ASSEMBLY -o "$SAMPLE_ID/" -s "$SAMPLE_ID" "$@"
fi



