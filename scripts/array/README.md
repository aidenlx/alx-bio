example: 

```sh
$ sbatch -a 1 -p normal -J pd-htb --output=htb.%j.out --cpus-per-task=16 ~/pipeline/scripts/array/hs37-snv.slurm 黄天宝.txt wgs
Submitted batch job 1616398

$ sbatch -p normal -J pd-htb-eh --output=htb-eh.%j.out --dependency=afterok:1616398_1 --cpus-per-task=16 ~/pipeline/scripts/expansionhunter.sh 黄天宝/bamfile/黄天宝.bqsr.bam 黄天宝/expansion htb
Submitted batch job ...

$ sbatch -a 1 -p normal -J pd-htb-vcf --output=htb-vcf.%j.out --cpus-per-task=16 --dependency=aftercorr:1616398_1 ~/pipeline/scripts/array/hs37-snv-vcf.slurm 黄天宝.txt wgs
Submitted batch job ...
