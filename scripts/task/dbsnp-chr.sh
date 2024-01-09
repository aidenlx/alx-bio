#!/bin/bash

function download() {
    assembly=$1
    prefix=$2
    output=${assembly}_assembly_report.txt
    wget -N "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/405/${assembly}/${output}"
    # filter where $7 is of form "[0-9XYM]+"
    grep -e '^[^#]' $output | awk '$1 ~ /^[0-9XYM]+$/{print $7, "chr"$1}' > ${assembly}.chrnames
    echo $assembly DONE
}

download GCF_000001405.40_GRCh38.p14 &
download GCF_000001405.25_GRCh37.p13 &
wait

echo all done