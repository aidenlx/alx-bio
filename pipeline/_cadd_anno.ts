// https://cadd.gs.washington.edu/static/ReleaseNotes_CADD_v1.6.pdf

const GRCh38_v1_6 = {
  "(Chrom)": {
    id: 1,
    name: "(Chrom)",
    type: "string",
    description: "Chromosome",
  },
  "(Pos)": {
    id: 2,
    name: "(Pos)",
    type: "integer",
    description: "Position (1-based)",
  },
  Ref: {
    id: 3,
    name: "Ref",
    type: "factor",
    description: "Reference allele (default: N)",
  },
  Alt: {
    id: 4,
    name: "Alt",
    type: "factor",
    description: "Observed allele (default: N)",
  },
  Type: {
    id: 5,
    name: "Type",
    type: "factor",
    description: "Event type (SNV, DEL, INS)",
  },
  Length: {
    id: 6,
    name: "Length",
    type: "integer",
    description: "Number of inserted/deleted bases",
  },
  "(AnnoType)": {
    id: 7,
    name: "(AnnoType)",
    type: "factor",
    description:
      "CodingTranscript, Intergenic, MotifFeature, NonCodingTranscript, RegulatoryFeature, Transcript",
  },
  Consequence: {
    id: 8,
    name: "Consequence",
    type: "factor",
    description:
      "VEP consequence, priority selected by potential impact (default: UNKNOWN)",
  },
  "(ConsScore)": {
    id: 9,
    name: "(ConsScore)",
    type: "integer",
    description: "Custom deleterious score assigned to Consequence",
  },
  "(ConsDetail)": {
    id: 10,
    name: "(ConsDetail)",
    type: "string",
    description: "Trimmed VEP consequence prior to simplification",
  },
  GC: {
    id: 11,
    name: "GC",
    type: "float",
    description: "Percent GC in a window of +/- 75bp (default: 0.42)",
  },
  CpG: {
    id: 12,
    name: "CpG",
    type: "float",
    description: "Percent CpG in a window of +/- 75bp (default: 0.02)",
  },
  motifECount: {
    id: 13,
    name: "motifECount",
    type: "integer",
    description: "Total number of overlapping motifs (default: 0)",
  },
  "(motifEName)": {
    id: 14,
    name: "(motifEName)",
    type: "string",
    description: "Name of sequence motif the position overlaps",
  },
  motifEHIPos: {
    id: 15,
    name: "motifEHIPos",
    type: "bool",
    description:
      "Is the position considered highly informative for an overlapping motif by VEP (default: 0)",
  },
  motifEScoreChng: {
    id: 16,
    name: "motifEScoreChng",
    type: "float",
    description: "VEP score change for the overlapping motif site (default: 0)",
  },
  oAA: {
    id: 17,
    name: "oAA",
    type: "factor",
    description: "Reference amino acid (default: unknown)",
  },
  nAA: {
    id: 18,
    name: "nAA",
    type: "factor",
    description: "Amino acid of observed variant (default: unknown)",
  },
  "(GeneID)": {
    id: 19,
    name: "(GeneID)",
    type: "string",
    description: "ENSEMBL GeneID",
  },
  "(FeatureID)": {
    id: 20,
    name: "(FeatureID)",
    type: "string",
    description: "ENSEMBL feature ID (Transcript ID or regulatory feature ID)",
  },
  "(GeneName)": {
    id: 21,
    name: "(GeneName)",
    type: "string",
    description: "GeneName provided in ENSEMBL annotation",
  },
  "(CCDS)": {
    id: 22,
    name: "(CCDS)",
    type: "string",
    description: "Consensus Coding Sequence ID",
  },
  "(Intron)": {
    id: 23,
    name: "(Intron)",
    type: "string",
    description: "Intron number/Total number of exons",
  },
  "(Exon)": {
    id: 24,
    name: "(Exon)",
    type: "string",
    description: "Exon number/Total number of exons",
  },
  cDNApos: {
    id: 25,
    name: "cDNApos",
    type: "float",
    description: "Base position from transcription start (default: 0*)",
  },
  relcDNApos: {
    id: 26,
    name: "relcDNApos",
    type: "float",
    description: "Relative position in transcript (default: 0)",
  },
  CDSpos: {
    id: 27,
    name: "CDSpos",
    type: "float",
    description: "Base position from coding start (default: 0*)",
  },
  relCDSpos: {
    id: 28,
    name: "relCDSpos",
    type: "float",
    description: "Relative position in coding sequence (default: 0)",
  },
  protPos: {
    id: 29,
    name: "protPos",
    type: "float",
    description: "Amino acid position from coding start (default: 0*)",
  },
  relProtPos: {
    id: 30,
    name: "relProtPos",
    type: "float",
    description: "Relative position in protein codon (default: 0)",
  },
  Domain: {
    id: 31,
    name: "Domain",
    type: "factor",
    description:
      'Domain annotation inferred from VEP annotation (ncoils, sigp, lcompl, hmmpanther, ndomain = "other named domain") (default: UD)',
  },
  Dst2Splice: {
    id: 32,
    name: "Dst2Splice",
    type: "float",
    description:
      "Distance to splice site in 20bp; positive: exonic, negative: intronic (default: 0)",
  },
  Dst2SplType: {
    id: 33,
    name: "Dst2SplType",
    type: "factor",
    description: "Closest splice site is ACCEPTOR or DONOR (default: unknown)",
  },
  minDistTSS: {
    id: 34,
    name: "minDistTSS",
    type: "float",
    description:
      "Distance to closest Transcribed Sequence Start (TSS) (default: 5.5)",
  },
  minDistTSE: {
    id: 35,
    name: "minDistTSE",
    type: "float",
    description:
      "Distance to closest Transcribed Sequence End (TSE) (default: 5.5)",
  },
  SIFTcat: {
    id: 36,
    name: "SIFTcat",
    type: "factor",
    description: "SIFT category of change (default: UD)",
  },
  SIFTval: {
    id: 37,
    name: "SIFTval",
    type: "float",
    description: "SIFT score (default: 0*)",
  },
  PolyPhenCat: {
    id: 38,
    name: "PolyPhenCat",
    type: "factor",
    description: "PolyPhen category of change (default: UD)",
  },
  PolyPhenVal: {
    id: 39,
    name: "PolyPhenVal",
    type: "float",
    description: "PolyPhen score (default: 0*)",
  },
  priPhCons: {
    id: 40,
    name: "priPhCons",
    type: "float",
    description:
      "Primate PhastCons conservation score (excl. human) (default: 0.0)",
  },
  mamPhCons: {
    id: 41,
    name: "mamPhCons",
    type: "float",
    description:
      "Mammalian PhastCons conservation score (excl. human) (default: 0.0)",
  },
  verPhCons: {
    id: 42,
    name: "verPhCons",
    type: "float",
    description:
      "Vertebrate PhastCons conservation score (excl. human) (default: 0.0)",
  },
  priPhyloP: {
    id: 43,
    name: "priPhyloP",
    type: "float",
    description: "Primate PhyloP score (excl. human) (default: -0.029)",
  },
  mamPhyloP: {
    id: 44,
    name: "mamPhyloP",
    type: "float",
    description: "Mammalian PhyloP score (excl. human) (default: -0.005)",
  },
  verPhyloP: {
    id: 45,
    name: "verPhyloP",
    type: "float",
    description: "Vertebrate PhyloP score (excl. human) (default: 0.042)",
  },
  bStatistic: {
    id: 46,
    name: "bStatistic",
    type: "integer",
    description: "Background selection score (default: 800)",
  },
  targetScan: {
    id: 47,
    name: "targetScan",
    type: "integer",
    description: "targetscan (default: 0*)",
  },
  "mirSVR-Score": {
    id: 48,
    name: "mirSVR-Score",
    type: "float",
    description: "mirSVR-Score (default: 0*)",
  },
  "mirSVR-E": {
    id: 49,
    name: "mirSVR-E",
    type: "float",
    description: "mirSVR-E (default: 0)",
  },
  "mirSVR-Aln": {
    id: 50,
    name: "mirSVR-Aln",
    type: "integer",
    description: "mirSVR-Aln (default: 0)",
  },
  cHmm_E1: {
    id: 51,
    name: "cHmm_E1",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E1_poised (default: 1.92*)",
  },
  cHmm_E2: {
    id: 52,
    name: "cHmm_E2",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E2_repressed (default: 1.92)",
  },
  cHmm_E3: {
    id: 53,
    name: "cHmm_E3",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E3_dead (default: 1.92)",
  },
  cHmm_E4: {
    id: 54,
    name: "cHmm_E4",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E4_dead (default: 1.92)",
  },
  cHmm_E5: {
    id: 55,
    name: "cHmm_E5",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E5_repressed (default: 1.92)",
  },
  cHmm_E6: {
    id: 56,
    name: "cHmm_E6",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E6_repressed (default: 1.92)",
  },
  cHmm_E7: {
    id: 57,
    name: "cHmm_E7",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E7_weak (default: 1.92)",
  },
  cHmm_E8: {
    id: 58,
    name: "cHmm_E8",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E8_gene (default: 1.92)",
  },
  cHmm_E9: {
    id: 59,
    name: "cHmm_E9",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E9_gene (default: 1.92)",
  },
  cHmm_E10: {
    id: 60,
    name: "cHmm_E10",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E10_gene (default: 1.92)",
  },
  cHmm_E11: {
    id: 61,
    name: "cHmm_E11",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E11_gene (default: 1.92)",
  },
  cHmm_E12: {
    id: 62,
    name: "cHmm_E12",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E12_distal (default: 1.92)",
  },
  cHmm_E13: {
    id: 63,
    name: "cHmm_E13",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E13_distal (default: 1.92)",
  },
  cHmm_E14: {
    id: 64,
    name: "cHmm_E14",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E14_distal (default: 1.92)",
  },
  cHmm_E15: {
    id: 65,
    name: "cHmm_E15",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E15_weak (default: 1.92)",
  },
  cHmm_E16: {
    id: 66,
    name: "cHmm_E16",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E16_tss (default: 1.92)",
  },
  cHmm_E17: {
    id: 67,
    name: "cHmm_E17",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E17_proximal (default: 1.92)",
  },
  cHmm_E18: {
    id: 68,
    name: "cHmm_E18",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E18_proximal (default: 1.92)",
  },
  cHmm_E19: {
    id: 69,
    name: "cHmm_E19",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E19_tss (default: 1.92)",
  },
  cHmm_E20: {
    id: 70,
    name: "cHmm_E20",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E20_poised (default: 1.92)",
  },
  cHmm_E21: {
    id: 71,
    name: "cHmm_E21",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E21_dead (default: 1.92)",
  },
  cHmm_E22: {
    id: 72,
    name: "cHmm_E22",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E22_repressed (default: 1.92)",
  },
  cHmm_E23: {
    id: 73,
    name: "cHmm_E23",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E23_weak (default: 1.92)",
  },
  cHmm_E24: {
    id: 74,
    name: "cHmm_E24",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E24_distal (default: 1.92)",
  },
  cHmm_E25: {
    id: 75,
    name: "cHmm_E25",
    type: "float",
    description:
      "Number of 48 cell types in chromHMM state E25_distal (default: 1.92)",
  },
  GerpRS: {
    id: 76,
    name: "GerpRS",
    type: "float",
    description: "Gerp element score (default: 0)",
  },
  GerpRSpval: {
    id: 77,
    name: "GerpRSpval",
    type: "float",
    description: "Gerp element p-Value (default: 0)",
  },
  GerpN: {
    id: 78,
    name: "GerpN",
    type: "float",
    description: "Neutral evolution score defined by GERP++ (default: 3.0)",
  },
  GerpS: {
    id: 79,
    name: "GerpS",
    type: "float",
    description:
      "Rejected Substitution score defined by GERP++ (default: -0.2)",
  },
  tOverlapMotifs: {
    id: 80,
    name: "tOverlapMotifs",
    type: "float",
    description: "Number of overlapping predicted TF motifs",
  },
  motifDist: {
    id: 81,
    name: "motifDist",
    type: "float",
    description:
      "Reference minus alternate allele difference in nucleotide frequency within an predicted overlapping motif (default: 0)",
  },
  "EncodeH3K4me1-sum": {
    id: 82,
    name: "EncodeH3K4me1-sum",
    type: "float",
    description:
      "Sum of Encode H3K4me1 levels (from 13 cell lines) (default: 0.76)",
  },
  "EncodeH3K4me1- max": {
    id: 83,
    name: "EncodeH3K4me1- max",
    type: "float",
    description:
      "Maximum Encode H3K4me1 level (from 13 cell lines) (default: 0.37)",
  },
  "EncodeH3K4me2-sum": {
    id: 84,
    name: "EncodeH3K4me2-sum",
    type: "float",
    description:
      "Sum of Encode H3K4me2 levels (from 14 cell lines) (default: 0.73)",
  },
  "EncodeH3K4me2- max": {
    id: 85,
    name: "EncodeH3K4me2- max",
    type: "float",
    description:
      "Maximum Encode H3K4me2 level (from 14 cell lines) (default: 0.37)",
  },
  "EncodeH3K4me3-sum": {
    id: 86,
    name: "EncodeH3K4me3-sum",
    type: "float",
    description:
      "Sum of Encode H3K4me3 levels (from 14 cell lines) (default: 0.81)",
  },
  "EncodeH3K4me3- max": {
    id: 87,
    name: "EncodeH3K4me3- max",
    type: "float",
    description:
      "Maximum Encode H3K4me3 level (from 14 cell lines) (default: 0.38)",
  },
  "EncodeH3K9ac-sum": {
    id: 88,
    name: "EncodeH3K9ac-sum",
    type: "float",
    description:
      "Sum of Encode H3K9ac levels (from 13 cell lines) (default: 0.82)",
  },
  "EncodeH3K9ac-max": {
    id: 89,
    name: "EncodeH3K9ac-max",
    type: "float",
    description:
      "Maximum Encode H3K9ac level (from 13 cell lines) (default: 0.41)",
  },
  "EncodeH3K9me3-sum": {
    id: 90,
    name: "EncodeH3K9me3-sum",
    type: "float",
    description:
      "Sum of Encode H3K9me3 levels (from 14 cell lines) (default: 0.81)",
  },
  "EncodeH3K9me3- max": {
    id: 91,
    name: "EncodeH3K9me3- max",
    type: "float",
    description:
      "Maximum Encode H3K9me3 level (from 14 cell lines) (default: 0.38)",
  },
  "EncodeH3K27ac-sum": {
    id: 92,
    name: "EncodeH3K27ac-sum",
    type: "float",
    description:
      "Sum of Encode H3K27ac levels (from 14 cell lines) (default: 0.74)",
  },
  "EncodeH3K27ac-max": {
    id: 93,
    name: "EncodeH3K27ac-max",
    type: "float",
    description:
      "Maximum Encode H3K27ac level (from 14 cell lines) (default: 0.36)",
  },
  "EncodeH3K27me3- sum": {
    id: 94,
    name: "EncodeH3K27me3- sum",
    type: "float",
    description:
      "Sum of Encode H3K27me3 levels (from 14 cell lines) (default: 0.93)",
  },
  "EncodeH3K27me3- max": {
    id: 95,
    name: "EncodeH3K27me3- max",
    type: "float",
    description:
      "Maximum Encode H3K27me3 level (from 14 cell lines) (default: 0.47)",
  },
  "EncodeH3K36me3- sum": {
    id: 96,
    name: "EncodeH3K36me3- sum",
    type: "float",
    description:
      "Sum of Encode H3K36me3 levels (from 10 cell lines) (default: 0.71)",
  },
  "EncodeH3K36me3- max": {
    id: 97,
    name: "EncodeH3K36me3- max",
    type: "float",
    description:
      "Maximum Encode H3K36me3 level (from 10 cell lines) (default: 0.39)",
  },
  "EncodeH3K79me2- sum": {
    id: 98,
    name: "EncodeH3K79me2- sum",
    type: "float",
    description:
      "Sum of Encode H3K79me2 levels (from 13 cell lines) (default: 0.64)",
  },
  "EncodeH3K79me2- max": {
    id: 99,
    name: "EncodeH3K79me2- max",
    type: "float",
    description:
      "Maximum Encode H3K79me2 level (from 13 cell lines) (default: 0.34)",
  },
  "EncodeH4K20me1- sum": {
    id: 100,
    name: "EncodeH4K20me1- sum",
    type: "float",
    description:
      "Sum of Encode H4K20me1 levels (from 11 cell lines) (default: 0.88)",
  },
  "EncodeH4K20me1- max": {
    id: 101,
    name: "EncodeH4K20me1- max",
    type: "float",
    description:
      "Maximum Encode H4K20me1 level (from 11 cell lines) (default: 0.47)",
  },
  "EncodeH2AFZ-sum": {
    id: 102,
    name: "EncodeH2AFZ-sum",
    type: "float",
    description:
      "Sum of Encode H2AFZ levels (from 13 cell lines) (default: 0.9)",
  },
  "EncodeH2AFZ-max": {
    id: 103,
    name: "EncodeH2AFZ-max",
    type: "float",
    description:
      "Maximum Encode H2AFZ level (from 13 cell lines) (default: 0.42)",
  },
  "EncodeDNase-sum": {
    id: 104,
    name: "EncodeDNase-sum",
    type: "float",
    description:
      "Sum of Encode DNase-seq levels (from 12 cell lines) (default: 0.0)",
  },
  "EncodeDNase-max": {
    id: 105,
    name: "EncodeDNase-max",
    type: "float",
    description:
      "Maximum Encode DNase-seq level (from 12 cell lines) (default: 0.0)",
  },
  "EncodetotalRNA-sum": {
    id: 106,
    name: "EncodetotalRNA-sum",
    type: "float",
    description:
      "Sum of Encode totalRNA-seq levels (from 10 cell lines always minus and plus strand) (default: 0.0)",
  },
  "EncodetotalRNA-max": {
    id: 107,
    name: "EncodetotalRNA-max",
    type: "float",
    description:
      "Maximum Encode totalRNA-seq level (from 10 cell lines, minus and plus strand separately) (default: 0.0)",
  },
  Grantham: {
    id: 108,
    name: "Grantham",
    type: "float",
    description: "Grantham score: oAA,nAA (default: 0*)",
  },
  "SpliceAI-acc-gain": {
    id: 109,
    name: "SpliceAI-acc-gain",
    type: "float",
    description: "Masked SpliceAI acceptor gain score (default: 0*)",
  },
  "SpliceAI-acc-loss": {
    id: 110,
    name: "SpliceAI-acc-loss",
    type: "float",
    description: "Masked SpliceAI acceptor loss score (default: 0)",
  },
  "SpliceAI-don-gain": {
    id: 111,
    name: "SpliceAI-don-gain",
    type: "float",
    description: "Masked SpliceAI donor gain score (default: 0)",
  },
  "SpliceAI-don-loss": {
    id: 112,
    name: "SpliceAI-don-loss",
    type: "float",
    description: "Masked SpliceAI donor loss score (default: 0)",
  },
  MMSp_acceptorIntron: {
    id: 113,
    name: "MMSp_acceptorIntron",
    type: "float",
    description: "MMSplice acceptor intron (intron 3’) score (default: 0)",
  },
  MMSp_acceptor: {
    id: 114,
    name: "MMSp_acceptor",
    type: "float",
    description: "MMSplice acceptor score (default: 0)",
  },
  MMSp_exon: {
    id: 115,
    name: "MMSp_exon",
    type: "float",
    description: "MMSplice exon score (default: 0)",
  },
  MMSp_donor: {
    id: 116,
    name: "MMSp_donor",
    type: "float",
    description: "MMSplice donor score (default: 0)",
  },
  MMSp_donorIntron: {
    id: 117,
    name: "MMSp_donorIntron",
    type: "float",
    description: "MMSplice donor intron (intron 5’) )score (default: 0)",
  },
  Dist2Mutation: {
    id: 118,
    name: "Dist2Mutation",
    type: "float",
    description:
      "Distance between the closest BRAVO SNV up and downstream (position itself excluded) (default: 0*)",
  },
  Freq100bp: {
    id: 119,
    name: "Freq100bp",
    type: "integer",
    description:
      "Number of frequent (MAF > 0.05) BRAVO SNV in 100 bp window nearby (default: 0)",
  },
  Rare100bp: {
    id: 120,
    name: "Rare100bp",
    type: "integer",
    description:
      "Number of rare (MAF < 0.05) BRAVO SNV in 100 bp window nearby (default: 0)",
  },
  Sngl100bp: {
    id: 121,
    name: "Sngl100bp",
    type: "integer",
    description:
      "Number of single occurrence BRAVO SNV in 100 bp window nearby (default: 0)",
  },
  Freq1000bp: {
    id: 122,
    name: "Freq1000bp",
    type: "integer",
    description:
      "Number of frequent (MAF > 0.05) BRAVO SNV in 1000 bp window nearby (default: 0)",
  },
  Rare1000bp: {
    id: 123,
    name: "Rare1000bp",
    type: "integer",
    description:
      "Number of rare (MAF < 0.05) BRAVO SNV in 1000 bp window nearby (default: 0)",
  },
  Sngl1000bp: {
    id: 124,
    name: "Sngl1000bp",
    type: "integer",
    description:
      "Number of single occurrence BRAVO SNV in 1000 bp window nearby (default: 0)",
  },
  Freq10000bp: {
    id: 125,
    name: "Freq10000bp",
    type: "integer",
    description:
      "Number of frequent (MAF > 0.05) BRAVO SNV in 10000 bp window nearby (default: 0)",
  },
  Rare10000bp: {
    id: 126,
    name: "Rare10000bp",
    type: "integer",
    description:
      "Number of rare (MAF < 0.05) BRAVO SNV in 10000 bp window nearby (default: 0)",
  },
  Sngl10000bp: {
    id: 127,
    name: "Sngl10000bp",
    type: "integer",
    description:
      "Number of single occurrence BRAVO SNV in 10000 bp window nearby (default: 0)",
  },
  "EnsembleRegulatory- Feature": {
    id: 128,
    name: "EnsembleRegulatory- Feature",
    type: "factor",
    description:
      "Matches in the Ensemble Regulatory Built (similar to annotype) (default: NA)",
  },
  "dbscSNV-ada_score": {
    id: 129,
    name: "dbscSNV-ada_score",
    type: "float",
    description: "Adaboost classifier score from dbscSNV (default: 0*)",
  },
  "dbscSNV-rf_score": {
    id: 130,
    name: "dbscSNV-rf_score",
    type: "float",
    description: "Random forest classifier score from dbscSNV (default: 0*)",
  },
  RemapOverlapTF: {
    id: 131,
    name: "RemapOverlapTF",
    type: "integer",
    description:
      "Remap number of different transcription factors binding (default: - 0.5)",
  },
  RemapOverlapCL: {
    id: 132,
    name: "RemapOverlapCL",
    type: "integer",
    description:
      "Remap number of different transcription factor - cell line combinations binding (default: -0.5)",
  },
  RawScore: {
    id: 133,
    name: "RawScore",
    type: "float",
    description: "Raw score from the model",
  },
  PHRED: {
    id: 134,
    name: "PHRED",
    type: "float",
    description: "CADD PHRED Score",
  },
} as const;

const GRCh37_v1_6 = {
  "(Chrom)": {
    id: 1,
    name: "(Chrom)",
    type: "string",
    description: "Chromosome",
  },
  "(Pos)": {
    id: 2,
    name: "(Pos)",
    type: "integer",
    description: "Position (1-based)",
  },
  Ref: {
    id: 3,
    name: "Ref",
    type: "factor",
    description: "Reference allele (default: N)",
  },
  Alt: {
    id: 4,
    name: "Alt",
    type: "factor",
    description: "Observed allele (default: N)",
  },
  Type: {
    id: 5,
    name: "Type",
    type: "factor",
    description: "Event type (SNV, DEL, INS)",
  },
  Length: {
    id: 6,
    name: "Length",
    type: "integer",
    description: "Number of inserted/deleted bases",
  },
  "(Annotype)": {
    id: 7,
    name: "(Annotype)",
    type: "factor",
    description:
      "CodingTranscript, Intergenic, MotifFeature, NonCodingTranscript, RegulatoryFeature, Transcript",
  },
  Consequence: {
    id: 8,
    name: "Consequence",
    type: "factor",
    description:
      "VEP consequence, priority selected by potential impact (default: UNKNOWN)",
  },
  "(ConsScore)": {
    id: 9,
    name: "(ConsScore)",
    type: "integer",
    description: "Custom deleterious score assigned to Consequence",
  },
  "(ConsDetail)": {
    id: 10,
    name: "(ConsDetail)",
    type: "string",
    description: "Trimmed VEP consequence prior to simplification",
  },
  GC: {
    id: 11,
    name: "GC",
    type: "float",
    description: "Percent GC in a window of +/- 75bp (default: 0.42)",
  },
  CpG: {
    id: 12,
    name: "CpG",
    type: "float",
    description: "Percent CpG in a window of +/- 75bp (default: 0.02)",
  },
  MotifECount: {
    id: 13,
    name: "MotifECount",
    type: "integer",
    description: "Total number of overlapping motifs (default: 0)",
  },
  "(MotifEName)": {
    id: 14,
    name: "(MotifEName)",
    type: "string",
    description: "Name of sequence motif the position overlaps",
  },
  MotifEHIPos: {
    id: 15,
    name: "MotifEHIPos",
    type: "bool",
    description:
      "Is the position considered highly informative for an overlapping motif by VEP (default: 0)",
  },
  MotifEScoreChng: {
    id: 16,
    name: "MotifEScoreChng",
    type: "float",
    description: "VEP score change for the overlapping motif site (default: 0)",
  },
  oAA: {
    id: 17,
    name: "oAA",
    type: "factor",
    description: "Reference amino acid (default: unknown)",
  },
  nAA: {
    id: 18,
    name: "nAA",
    type: "factor",
    description: "Amino acid of observed variant (default: unknown)",
  },
  "(GeneID)": {
    id: 19,
    name: "(GeneID)",
    type: "string",
    description: "ENSEMBL GeneID",
  },
  "(FeatureID)": {
    id: 20,
    name: "(FeatureID)",
    type: "string",
    description: "ENSEMBL feature ID (Transcript ID or regulatory feature ID)",
  },
  "(GeneName)": {
    id: 21,
    name: "(GeneName)",
    type: "string",
    description: "GeneName provided in ENSEMBL annotation",
  },
  "(CCDS)": {
    id: 22,
    name: "(CCDS)",
    type: "string",
    description: "Consensus Coding Sequence ID",
  },
  "(Intron)": {
    id: 23,
    name: "(Intron)",
    type: "string",
    description: "Intron number/Total number of exons",
  },
  "(Exon)": {
    id: 24,
    name: "(Exon)",
    type: "string",
    description: "Exon number/Total number of exons",
  },
  cDNApos: {
    id: 25,
    name: "cDNApos",
    type: "float",
    description: "Base position from transcription start (default: 0*)",
  },
  relcDNApos: {
    id: 26,
    name: "relcDNApos",
    type: "float",
    description: "Relative position in transcript (default: 0)",
  },
  CDSpos: {
    id: 27,
    name: "CDSpos",
    type: "float",
    description: "Base position from coding start (default: 0*)",
  },
  relCDSpos: {
    id: 28,
    name: "relCDSpos",
    type: "float",
    description: "Relative position in coding sequence (default: 0)",
  },
  protPos: {
    id: 29,
    name: "protPos",
    type: "float",
    description: "Amino acid position from coding start (default: 0*)",
  },
  relprotPos: {
    id: 30,
    name: "relprotPos",
    type: "float",
    description: "Relative position in protein codon (default: 0)",
  },
  Domain: {
    id: 31,
    name: "Domain",
    type: "factor",
    description:
      'Domain annotation inferred from VEP annotation (ncoils, sigp, lcompl, hmmpanther, ndomain = "other named domain") (default: UD)',
  },
  Dst2Splice: {
    id: 32,
    name: "Dst2Splice",
    type: "float",
    description:
      "Distance to splice site in 20bp; positive: exonic, negative: intronic (default: 0)",
  },
  Dst2SplType: {
    id: 33,
    name: "Dst2SplType",
    type: "factor",
    description: "Closest splice site is ACCEPTOR or DONOR (default: unknown)",
  },
  MinDistTSS: {
    id: 34,
    name: "MinDistTSS",
    type: "float",
    description:
      "Distance to closest Transcribed Sequence Start (TSS) (default: 5.5)",
  },
  MinDistTSE: {
    id: 35,
    name: "MinDistTSE",
    type: "float",
    description:
      "Distance to closest Transcribed Sequence End (TSE) (default: 5.5)",
  },
  SIFTcat: {
    id: 36,
    name: "SIFTcat",
    type: "factor",
    description: "SIFT category of change (default: UD)",
  },
  SIFTval: {
    id: 37,
    name: "SIFTval",
    type: "float",
    description: "SIFT score (default: 0*)",
  },
  PolyPhenCat: {
    id: 38,
    name: "PolyPhenCat",
    type: "factor",
    description: "PolyPhen category of change (default: UD)",
  },
  PolyPhenVal: {
    id: 39,
    name: "PolyPhenVal",
    type: "float",
    description: "PolyPhen score (default: 0*)",
  },
  priPhCons: {
    id: 40,
    name: "priPhCons",
    type: "float",
    description:
      "Primate PhastCons conservation score (excl. human) (default: 0.115)",
  },
  mamPhCons: {
    id: 41,
    name: "mamPhCons",
    type: "float",
    description:
      "Mammalian PhastCons conservation score (excl. human) (default: 0.079)",
  },
  verPhCons: {
    id: 42,
    name: "verPhCons",
    type: "float",
    description:
      "Vertebrate PhastCons conservation score (excl. human) (default: 0.094)",
  },
  priPhyloP: {
    id: 43,
    name: "priPhyloP",
    type: "float",
    description: "Primate PhyloP score (excl. human) (default: -0.033)",
  },
  mamPhyloP: {
    id: 44,
    name: "mamPhyloP",
    type: "float",
    description: "Mammalian PhyloP score (excl. human) (default: -0.038)",
  },
  verPhyloP: {
    id: 45,
    name: "verPhyloP",
    type: "float",
    description: "Vertebrate PhyloP score (excl. human) (default: 0.017)",
  },
  bStatistic: {
    id: 46,
    name: "bStatistic",
    type: "integer",
    description: "Background selection score (default: 800)",
  },
  targetScan: {
    id: 47,
    name: "targetScan",
    type: "integer",
    description: "targetscan (default: 0*)",
  },
  "mirSVR-Score": {
    id: 48,
    name: "mirSVR-Score",
    type: "float",
    description: "mirSVR-Score (default: 0*)",
  },
  "mirSVR-E": {
    id: 49,
    name: "mirSVR-E",
    type: "float",
    description: "mirSVR-E (default: 0)",
  },
  "mirSVR-Aln": {
    id: 50,
    name: "mirSVR-Aln",
    type: "integer",
    description: "mirSVR-Aln (default: 0)",
  },
  cHmmTssA: {
    id: 51,
    name: "cHmmTssA",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmTssA state (default: 0.0667*)",
  },
  cHmmTssAFlnk: {
    id: 52,
    name: "cHmmTssAFlnk",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmTssAFlnk state (default: 0.0667)",
  },
  cHmmTxFlnk: {
    id: 53,
    name: "cHmmTxFlnk",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmTxFlnk state (default: 0.0667)",
  },
  cHmmTx: {
    id: 54,
    name: "cHmmTx",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmTx state (default: 0.0667)",
  },
  cHmmTxWk: {
    id: 55,
    name: "cHmmTxWk",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmTxWk state (default: 0.0667)",
  },
  cHmmEnhG: {
    id: 56,
    name: "cHmmEnhG",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmEnhG state (default: 0.0667)",
  },
  cHmmEnh: {
    id: 57,
    name: "cHmmEnh",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmEnh state (default: 0.0667)",
  },
  cHmmZnfRpts: {
    id: 58,
    name: "cHmmZnfRpts",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmZnfRpts state (default: 0.0667)",
  },
  cHmmHet: {
    id: 59,
    name: "cHmmHet",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmHet state (default: 0.0667)",
  },
  cHmmTssBiv: {
    id: 60,
    name: "cHmmTssBiv",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmTssBiv state (default: 0.0667)",
  },
  cHmmBivFlnk: {
    id: 61,
    name: "cHmmBivFlnk",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmBivFlnk state (default: 0.0667)",
  },
  cHmmEnhBiv: {
    id: 62,
    name: "cHmmEnhBiv",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmEnhBiv state (default: 0.0667)",
  },
  cHmmReprPC: {
    id: 63,
    name: "cHmmReprPC",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmReprPC state (default: 0.0667)",
  },
  cHmmReprPCWk: {
    id: 64,
    name: "cHmmReprPCWk",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmReprPCWk state (default: 0.0667)",
  },
  cHmmQuies: {
    id: 65,
    name: "cHmmQuies",
    type: "float",
    description:
      "Proportion of 127 cell types in cHmmQuies state (default: 0.0667)",
  },
  GerpRS: {
    id: 66,
    name: "GerpRS",
    type: "float",
    description: "Gerp element score (default: 0)",
  },
  GerpRSpval: {
    id: 67,
    name: "GerpRSpval",
    type: "float",
    description: "Gerp element p-Value (default: 0)",
  },
  GerpN: {
    id: 68,
    name: "GerpN",
    type: "float",
    description: "Neutral evolution score defined by GERP++ (default: 1.91)",
  },
  GerpS: {
    id: 69,
    name: "GerpS",
    type: "float",
    description:
      "Rejected Substitution score defined by GERP++ (default: -0.2)",
  },
  TFBS: {
    id: 70,
    name: "TFBS",
    type: "float",
    description:
      "Number of different overlapping ChIP transcription factor binding sites (default: 0)",
  },
  TFBSPeaks: {
    id: 71,
    name: "TFBSPeaks",
    type: "float",
    description:
      "Number of overlapping ChIP transcription factor binding site peaks summed over different cell types/tissue (default: 0)",
  },
  TFBSPeaksMax: {
    id: 72,
    name: "TFBSPeaksMax",
    type: "float",
    description:
      "Maximum value of overlapping ChIP transcription factor binding site peaks across cell types/tissue (default: 0)",
  },
  tOverlapMotifs: {
    id: 73,
    name: "tOverlapMotifs",
    type: "float",
    description: "Number of overlapping predicted TF motifs (default: 0)",
  },
  motifDist: {
    id: 74,
    name: "motifDist",
    type: "float",
    description:
      "Reference minus alternate allele difference in nucleotide frequency within an predicted overlapping motif (default: 0)",
  },
  Segway: {
    id: 75,
    name: "Segway",
    type: "factor",
    description: "Result of genomic segmentation algorithm (default: unknown)",
  },
  EncH3K27Ac: {
    id: 76,
    name: "EncH3K27Ac",
    type: "float",
    description: "Maximum ENCODE H3K27 acetylation level (default: 0)",
  },
  EncH3K4Me1: {
    id: 77,
    name: "EncH3K4Me1",
    type: "float",
    description: "Maximum ENCODE H3K4 methylation level (default: 0)",
  },
  EncH3K4Me3: {
    id: 78,
    name: "EncH3K4Me3",
    type: "float",
    description: "Maximum ENCODE H3K4 trimethylation level (default: 0)",
  },
  EncExp: {
    id: 79,
    name: "EncExp",
    type: "float",
    description: "Maximum ENCODE expression value (default: 0)",
  },
  EncNucleo: {
    id: 80,
    name: "EncNucleo",
    type: "float",
    description:
      "Maximum of ENCODE Nucleosome position track score (default: 0)",
  },
  EncOCC: {
    id: 81,
    name: "EncOCC",
    type: "integer",
    description: "ENCODE open chromatin code (default: 5)",
  },
  EncOCCombPVal: {
    id: 82,
    name: "EncOCCombPVal",
    type: "float",
    description:
      "ENCODE combined p-Value (PHRED-scale) of Faire, Dnase, polII, CTCF, Myc evidence for open chromatin (default: 0)",
  },
  EncOCDNasePVal: {
    id: 83,
    name: "EncOCDNasePVal",
    type: "float",
    description:
      "p-Value (PHRED-scale) of Dnase evidence for open chromatin (default: 0)",
  },
  EncOCFairePVal: {
    id: 84,
    name: "EncOCFairePVal",
    type: "float",
    description:
      "p-Value (PHRED-scale) of Faire evidence for open chromatin (default: 0)",
  },
  EncOCpolIIPVal: {
    id: 85,
    name: "EncOCpolIIPVal",
    type: "float",
    description:
      "p-Value (PHRED-scale) of polII evidence for open chromatin (default: 0)",
  },
  EncOCctcfPVal: {
    id: 86,
    name: "EncOCctcfPVal",
    type: "float",
    description:
      "p-Value (PHRED-scale) of CTCF evidence for open chromatin (default: 0)",
  },
  EncOCmycPVal: {
    id: 87,
    name: "EncOCmycPVal",
    type: "float",
    description:
      "p-Value (PHRED-scale) of Myc evidence for open chromatin (default: 0)",
  },
  EncOCDNaseSig: {
    id: 88,
    name: "EncOCDNaseSig",
    type: "float",
    description:
      "Peak signal for Dnase evidence of open chromatin (default: 0)",
  },
  EncOCFaireSig: {
    id: 89,
    name: "EncOCFaireSig",
    type: "float",
    description:
      "Peak signal for Faire evidence of open chromatin (default: 0)",
  },
  EncOCpolIISig: {
    id: 90,
    name: "EncOCpolIISig",
    type: "float",
    description:
      "Peak signal for polII evidence of open chromatin (default: 0)",
  },
  EncOCctcfSig: {
    id: 91,
    name: "EncOCctcfSig",
    type: "float",
    description: "Peak signal for CTCF evidence of open chromatin (default: 0)",
  },
  EncOCmycSig: {
    id: 92,
    name: "EncOCmycSig",
    type: "float",
    description: "Peak signal for Myc evidence of open chromatin (default: 0)",
  },
  Grantham: {
    id: 93,
    name: "Grantham",
    type: "float",
    description: "Grantham score: oAA,nAA (default: 0*)",
  },
  "SpliceAI-acc-gain": {
    id: 94,
    name: "SpliceAI-acc-gain",
    type: "float",
    description: "Masked SpliceAI acceptor gain score (default: 0*)",
  },
  "SpliceAI-acc-loss": {
    id: 95,
    name: "SpliceAI-acc-loss",
    type: "float",
    description: "Masked SpliceAI acceptor loss score (default: 0)",
  },
  "SpliceAI-don-gain": {
    id: 96,
    name: "SpliceAI-don-gain",
    type: "float",
    description: "Masked SpliceAI donor gain score (default: 0)",
  },
  "SpliceAI-don-loss": {
    id: 97,
    name: "SpliceAI-don-loss",
    type: "float",
    description: "Masked SpliceAI donor loss score (default: 0)",
  },
  MMSp_acceptorIntron: {
    id: 98,
    name: "MMSp_acceptorIntron",
    type: "float",
    description: "MMSplice acceptor intron (intron 3’) score (default: 0)",
  },
  MMSp_acceptor: {
    id: 99,
    name: "MMSp_acceptor",
    type: "float",
    description: "MMSplice acceptor score (default: 0)",
  },
  MMSp_exon: {
    id: 100,
    name: "MMSp_exon",
    type: "float",
    description: "MMSplice exon score (default: 0)",
  },
  MMSp_donor: {
    id: 101,
    name: "MMSp_donor",
    type: "float",
    description: "MMSplice donor score (default: 0)",
  },
  MMSp_donorIntron: {
    id: 102,
    name: "MMSp_donorIntron",
    type: "float",
    description: "MMSplice donor intron (intron 5’) )score (default: 0)",
  },
  Dist2Mutation: {
    id: 103,
    name: "Dist2Mutation",
    type: "float",
    description:
      "Distance between the closest gnomAD SNV up and downstream (position itself excluded) (default: 0*)",
  },
  Freq100bp: {
    id: 104,
    name: "Freq100bp",
    type: "integer",
    description:
      "Number of frequent (MAF > 0.05) gnomAD SNV in 100 bp window nearby (default: 0)",
  },
  Rare100bp: {
    id: 105,
    name: "Rare100bp",
    type: "integer",
    description:
      "Number of rare (MAF < 0.05) gnomAD SNV in 100 bp window nearby (default: 0)",
  },
  Sngl100bp: {
    id: 106,
    name: "Sngl100bp",
    type: "integer",
    description:
      "Number of single occurrence gnomAD SNV in 100 bp window nearby (default: 0)",
  },
  Freq1000bp: {
    id: 107,
    name: "Freq1000bp",
    type: "integer",
    description:
      "Number of frequent (MAF > 0.05) gnomAD SNV in 1000 bp window nearby (default: 0)",
  },
  Rare1000bp: {
    id: 108,
    name: "Rare1000bp",
    type: "integer",
    description:
      "Number of rare (MAF < 0.05) gnomAD SNV in 1000 bp window nearby (default: 0)",
  },
  Sngl1000bp: {
    id: 109,
    name: "Sngl1000bp",
    type: "integer",
    description:
      "Number of single occurrence gnomAD SNV in 1000 bp window nearby (default: 0)",
  },
  Freq10000bp: {
    id: 110,
    name: "Freq10000bp",
    type: "integer",
    description:
      "Number of frequent (MAF > 0.05) gnomAD SNV in 10000 bp window nearby (default: 0)",
  },
  Rare10000bp: {
    id: 111,
    name: "Rare10000bp",
    type: "integer",
    description:
      "Number of rare (MAF < 0.05) gnomAD SNV in 10000 bp window nearby (default: 0)",
  },
  Sngl10000bp: {
    id: 112,
    name: "Sngl10000bp",
    type: "integer",
    description:
      "Number of single occurrence gnomAD SNV in 10000 bp window nearby (default: 0)",
  },
  "dbscSNV-ada_score": {
    id: 113,
    name: "dbscSNV-ada_score",
    type: "float",
    description: "Adaboost classifier score from dbscSNV (default: 0*)",
  },
  "dbscSNV-rf_score": {
    id: 114,
    name: "dbscSNV-rf_score",
    type: "float",
    description: "Random forest classifier score from dbscSNV (default: 0*)",
  },
  RawScore: {
    id: 115,
    name: "RawScore",
    type: "float",
    description: "Raw score from the model",
  },
  PHRED: {
    id: 116,
    name: "PHRED",
    type: "float",
    description: "CADD PHRED Score",
  },
} as const;

export const CADDColumns = {
  GRCh37_v1_6,
  GRCh38_v1_6,
};

export type CADDCommonColumn = keyof (typeof CADDColumns)["GRCh37_v1_6"] &
  keyof (typeof CADDColumns)["GRCh38_v1_6"];
