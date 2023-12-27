#!/bin/bash
#SBATCH -p normal
#SBATCH -N 1
#SBATCH --cpus-per-task=4

# sbatch -J $name-str --array=1-24%4 ../run.slurm */bamfile/*.sort.hg38.bam */str ;

source $HOME/alx-bio/scripts/_base.sh
conda_init conda

conda activate nanorepeat

RES_DIR=/genetics/home/shiyan/bin/script/STR
CHR=$SLURM_ARRAY_TASK_ID

if [ -z "$CHR" ] || [ $CHR -lt 1 ] || [ $CHR -gt 24 ]; then
  echo "Invalid chromosome $CHR"
  exit 1
fi
if [ $CHR -eq 23 ]; then
  CHR=X
elif [ $CHR -eq 24 ]; then
  CHR=Y
fi

INPUT_BAM=$1
OUT_DIR=${2:-.}

if [ -f "$OUT_DIR/chr$CHR.done" ]; then
  echo "NanoRepeat already done for $INPUT_BAM, chr$CHR"
  exit 0
fi

mkdir -p $OUT_DIR/chr$CHR/

echo RUNNING for $INPUT_BAM, chr$CHR

nanoRepeat.py -i $INPUT_BAM \
  -o $OUT_DIR/chr$CHR/ \
  -r $RES_DIR/chr$CHR.fa \
  -b $RES_DIR/gangstr_exon/gangstr.exon.chr$CHR.txt \
  -t bam -c $THREADS \
  --samtools $(which samtools) --minimap2 $(which minimap2) && \
  touch $OUT_DIR/chr$CHR.done

