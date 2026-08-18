export const HUMAN_MICROBIOME_REAL = {"n_samples": 44, "groups": [{"name": "Autistic", "n": 23, "mean_shannon": 2.632, "mean_gi": 4.478}, {"name": "Neurotypical", "n": 21, "mean_shannon": 2.81, "mean_gi": 1.905}], "top_genera_overall": [{"name": "Phocaeicola", "pct": 15.29}, {"name": "Faecalibacterium", "pct": 12.07}, {"name": "Bacteroides", "pct": 10.94}, {"name": "Agathobacter", "pct": 5.8}, {"name": "Prevotella", "pct": 4.44}, {"name": "Gemmiger", "pct": 4.44}], "examples": [{"group": "Neurotypical", "sample_id": "N01", "shannon": 2.793, "gi_index": 0.0, "top_genera": [{"name": "Faecalibacterium", "pct": 22.99}, {"name": "Phocaeicola", "pct": 15.03}, {"name": "Gemmiger", "pct": 9.18}, {"name": "Bacteroides", "pct": 8.18}]}, {"group": "Autistic", "sample_id": "A01", "shannon": 2.924, "gi_index": 3.0, "top_genera": [{"name": "Hungatella", "pct": 29.79}, {"name": "Phocaeicola", "pct": 8.28}, {"name": "Intestinibacter", "pct": 7.58}, {"name": "Gemmiger", "pct": 5.34}]}], "source": "Kang et al. 2017, gut microbiome-metabolome curated collection"};


export const MICROBIOME_REAL = {"n_samples": 675, "n_otus": 6696, "diet_groups": [{"diet": 0, "n": 389, "mean_shannon": 3.122}, {"diet": 1, "n": 269, "mean_shannon": 3.473}, {"diet": 2, "n": 1, "mean_shannon": 3.743}, {"diet": 3, "n": 1, "mean_shannon": 3.527}, {"diet": 4, "n": 9, "mean_shannon": 1.338}, {"diet": 5, "n": 6, "mean_shannon": 3.697}], "top_otus_overall": [{"otu": "OTU4496", "pct": 11.48}, {"otu": "OTU4154", "pct": 7.31}, {"otu": "OTU3857", "pct": 4.13}, {"otu": "OTU618", "pct": 3.33}, {"otu": "OTU5948", "pct": 3.06}, {"otu": "OTU5429", "pct": 2.88}], "example_samples": [{"diet_group": 0, "sex": 0, "shannon": 3.248, "top_otus": [{"otu": "OTU4154", "pct": 19.24}, {"otu": "OTU4496", "pct": 18.35}, {"otu": "OTU1333", "pct": 5.39}, {"otu": "OTU3857", "pct": 4.17}]}, {"diet_group": 1, "sex": 0, "shannon": 3.921, "top_otus": [{"otu": "OTU4496", "pct": 12.26}, {"otu": "OTU3994", "pct": 11.07}, {"otu": "OTU3857", "pct": 5.69}, {"otu": "OTU1347", "pct": 5.42}]}, {"diet_group": 2, "sex": 0, "shannon": 3.743, "top_otus": [{"otu": "OTU1132", "pct": 12.02}, {"otu": "OTU6086", "pct": 8.75}, {"otu": "OTU1062", "pct": 7.07}, {"otu": "OTU5527", "pct": 6.98}]}, {"diet_group": 3, "sex": 0, "shannon": 3.527, "top_otus": [{"otu": "OTU6086", "pct": 19.32}, {"otu": "OTU4724", "pct": 8.78}, {"otu": "OTU3339", "pct": 8.39}, {"otu": "OTU5527", "pct": 7.41}]}], "shannon_overall_mean": 3.245, "shannon_overall_min": 0.609, "shannon_overall_max": 4.648};


// Representative composition modeled on real, published gut-brain-axis research
// (American Gut Project / HMP style phyla and genera) — not a live pull yet.


export const MICROBIOME_TAXA = [
  { name: "Firmicutes", type: "phylum", pct: 0.48, note: "Includes Lactobacillus — fermentation, short-chain fatty acid production" },
  { name: "Bacteroidetes", type: "phylum", pct: 0.32, note: "Fiber breakdown, generally associated with lower inflammation" },
  { name: "Actinobacteria", type: "phylum", pct: 0.09, note: "Includes Bifidobacterium — linked to gut-brain signaling" },
  { name: "Proteobacteria", type: "phylum", pct: 0.06, note: "Elevated levels often flagged as a dysbiosis marker" },
  { name: "Verrucomicrobia", type: "phylum", pct: 0.03, note: "Includes Akkermansia — gut lining integrity" },
  { name: "Other", type: "phylum", pct: 0.02, note: "" },
];
