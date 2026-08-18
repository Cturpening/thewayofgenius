import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { HUMAN_MICROBIOME_REAL, MICROBIOME_REAL, MICROBIOME_TAXA } from "./data/microbiomeTaxa";

export default function MicrobiomeView() {
  const [dietIdx, setDietIdx] = useState(0);
  const [humanIdx, setHumanIdx] = useState(0);
  const fb_ratio = (MICROBIOME_TAXA[0].pct / MICROBIOME_TAXA[1].pct).toFixed(2);
  const shannon = 3.4; // representative — typical healthy-range Shannon diversity index
  const real = MICROBIOME_REAL;
  const sample = real.example_samples[dietIdx];
  const human = HUMAN_MICROBIOME_REAL;
  const hSample = human.examples[humanIdx];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.gold}18`, border: `1px solid ${COLORS.gold}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Real human data — {human.n_samples} real people, real named bacterial genera, from a published
        gut-brain-axis study ({human.source}). This directly matches your Modality 4 framing: real GI
        symptom severity scores alongside real microbiome composition.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          REAL FINDING — GI SYMPTOM SEVERITY BY GROUP ({human.n_samples} REAL PEOPLE)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {human.groups.map((g) => (
            <div key={g.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: COLORS.ink }}>{g.name} (n={g.n})</span>
                <span style={{ fontSize: 12, color: COLORS.gold, fontFamily: "monospace" }}>GI index {g.mean_gi}</span>
              </div>
              <div style={{ height: 8, background: COLORS.bgPanelAlt, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(g.mean_gi / 5) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.coral}66, ${COLORS.coral})` }} />
              </div>
              <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 3 }}>Shannon diversity: {g.mean_shannon}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 10, lineHeight: 1.5 }}>
          Real, published result: the autism group shows GI symptom severity over twice as high as the
          neurotypical group in this real data — not something invented for this demo.
        </div>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 10, letterSpacing: 0.5 }}>
          REAL EXAMPLE PERSON — NAMED BACTERIAL GENERA
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {human.examples.map((s, i) => (
            <button key={i} onClick={() => setHumanIdx(i)} style={{
              padding: "6px 12px", borderRadius: 8,
              border: `1px solid ${humanIdx === i ? COLORS.gold : COLORS.grid}`,
              background: humanIdx === i ? `${COLORS.gold}22` : "transparent",
              color: humanIdx === i ? COLORS.gold : COLORS.inkDim, fontSize: 12, cursor: "pointer",
            }}>
              {s.group}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkDim, marginBottom: 10 }}>
          Real GI symptom index: <span style={{ color: COLORS.ink }}>{hSample.gi_index}</span> · Real Shannon diversity: <span style={{ color: COLORS.ink }}>{hSample.shannon}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {hSample.top_genera.map((o) => (
            <div key={o.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 110, fontSize: 11.5, color: COLORS.ink, fontStyle: "italic" }}>{o.name}</div>
              <div style={{ flex: 1, height: 6, background: COLORS.bgPanelAlt, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(o.pct / 30) * 100}%`, height: "100%", background: COLORS.gold }} />
              </div>
              <div style={{ width: 46, fontSize: 11, color: COLORS.ink, textAlign: "right" }}>{o.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: `${COLORS.teal}14`, border: `1px solid ${COLORS.tealDim}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Below is real mouse data (Turnbaugh et al.) kept for pipeline-robustness proof, and the original
        representative panel kept for phylum-level framing. The panel above is now the real, human,
        gut-brain-relevant one.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, letterSpacing: 0.5 }}>
          REAL FINDING — DIVERSITY BY DIET GROUP ({real.n_samples} SAMPLES)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {real.diet_groups.map((g) => (
            <div key={g.diet} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 70, fontSize: 12, color: COLORS.inkDim }}>Diet {g.diet}</div>
              <div style={{ flex: 1, height: 8, background: COLORS.bgPanelAlt, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(g.mean_shannon / 5) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.teal}66, ${COLORS.teal})` }} />
              </div>
              <div style={{ width: 90, fontSize: 11, color: COLORS.ink, fontFamily: "monospace" }}>{g.mean_shannon.toFixed(2)} (n={g.n})</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 10, lineHeight: 1.5 }}>
          Diet group 4 shows real, notably lower diversity ({real.diet_groups.find(g=>g.diet===4)?.mean_shannon}) than
          the others — a genuine signal in this dataset, not something invented for the demo.
        </div>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 10, letterSpacing: 0.5 }}>
          REAL EXAMPLE SAMPLE — CLICK A DIET GROUP
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {real.example_samples.map((s, i) => (
            <button key={i} onClick={() => setDietIdx(i)} style={{
              padding: "6px 12px", borderRadius: 8,
              border: `1px solid ${dietIdx === i ? COLORS.teal : COLORS.grid}`,
              background: dietIdx === i ? `${COLORS.teal}22` : "transparent",
              color: dietIdx === i ? COLORS.teal : COLORS.inkDim, fontSize: 12, cursor: "pointer",
            }}>
              Diet {s.diet_group}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkDim, marginBottom: 10 }}>
          Real Shannon diversity for this sample: <span style={{ color: COLORS.ink }}>{sample.shannon}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sample.top_otus.map((o) => (
            <div key={o.otu} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 80, fontSize: 11, color: COLORS.inkDim, fontFamily: "monospace" }}>{o.otu}</div>
              <div style={{ flex: 1, height: 6, background: COLORS.bgPanelAlt, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(o.pct / 20) * 100}%`, height: "100%", background: COLORS.gold }} />
              </div>
              <div style={{ width: 46, fontSize: 11, color: COLORS.ink, textAlign: "right" }}>{o.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Below is the representative panel from before (phylum-level, human gut-brain-axis framing) —
        kept because it has taxonomic names the real dataset above doesn't. Once a human, taxonomy-labeled
        sample is available, this becomes fully real too.
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 14, letterSpacing: 0.5 }}>
          REPRESENTATIVE PHYLUM COMPOSITION
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MICROBIOME_TAXA.map((t) => (
            <div key={t.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: COLORS.ink }}>{t.name}</span>
                <span style={{ fontSize: 12, color: COLORS.gold, fontFamily: "monospace" }}>{(t.pct * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: 7, background: COLORS.bgPanelAlt, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${t.pct * 100}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.gold}66, ${COLORS.gold})` }} />
              </div>
              {t.note && <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 3 }}>{t.note}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 160px", background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: COLORS.gold, fontFamily: "Georgia, serif" }}>{fb_ratio}</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Firmicutes / Bacteroidetes ratio</div>
        </div>
        <div style={{ flex: "1 1 160px", background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: COLORS.teal, fontFamily: "Georgia, serif" }}>{shannon}</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Shannon diversity index</div>
        </div>
        <div style={{ flex: "1 1 160px", background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 20, color: COLORS.coral, fontFamily: "Georgia, serif" }}>6/10</div>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>Gut-brain coherence (self-report, per your spec)</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.6 }}>
        Field names here match your Analytical Methods doc: microbiome_diversity_index, gi_symptom_score,
        gut_brain_coherence. Once real American Gut Project data is uploaded, these become computed
        values instead of representative ones — same upgrade path the EEG lane went through.
      </div>

      <div style={{ background: `${COLORS.violet}14`, border: `1px dashed ${COLORS.violet}55`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: COLORS.violet }}>Your Own Microbiome Data</div>
          <span style={{ fontSize: 9, color: COLORS.violet, letterSpacing: 0.5, border: `1px solid ${COLORS.violet}55`, borderRadius: 999, padding: "3px 9px", flexShrink: 0 }}>
            NOT YET AVAILABLE
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.6, marginBottom: 14 }}>
          The intended shape of this: upload results you already have from a third-party test
          (Viome, Tiny Health, Ombre, ZOE, or similar) — manual entry of what your own report already
          told you, not raw file parsing. This isn't wired up yet, and won't be turned on until Vanessa
          confirms it's compatible with the real data methods — the goal is a real, usable field, not a
          placeholder quietly holding red flags.
        </div>
        <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 8 }}>
          LIKELY FIELDS, ONCE THIS IS REAL
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Shannon diversity index — same real metric already shown above",
            "Top genera + percentages — whatever your own report names",
            "GI symptom severity score — self-reported, same scale as the real study data",
            "Gut-brain coherence (self-report) — same field already tracked here",
          ].map((f) => (
            <div key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: COLORS.violet, fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
