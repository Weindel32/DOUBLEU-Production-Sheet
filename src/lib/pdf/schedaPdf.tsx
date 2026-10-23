// PDF della scheda: tecnica (per produttore, modellista, sala taglio: niente costi)
// o interna (con costi per capo, margine e campioni di sviluppo). Stessi contenuti della vecchia stampa HTML.

import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { C, Campi, Intestazione, Piede, s } from "@/lib/pdf/base";

export type Coppia = [string, string | null | undefined];

export interface DatiSchedaPdf {
  interno: boolean;
  sopra: string; // "Scheda produzione" | "Costo articolo"
  nome: string;
  esecutiva: boolean;
  testata: Coppia[];
  immagini: { data: Buffer; format: "jpg" | "png" }[];
  info: Coppia[];
  specifiche: Coppia[];
  noteSpecifiche?: string | null;
  loghi: { nome: string; tecnica: string; posizione: string; dimensione?: string | null; note?: string | null }[];
  colori: { colore: string; hex: string; destinazione: string }[];
  notePersonalizzazione?: string | null;
  misure: { titolo: string; specifiche: Coppia[]; colonne: string[]; righe: { taglia: string; valori: string[] }[] } | null;
  // Elastico vita (Short, Skirt…): sta nelle caselle delle quantità, così entra nella prima pagina
  quantita: { taglie: { taglia: string; q: number; elastico?: string }[]; totale: number; elastico?: { titolo: string; specifiche: Coppia[] } } | null;
  produzione: Coppia[];
  costi: {
    consumi: { nome: string; testo: string }[];
    accessori: { nome: string; testo: string }[];
    righe: Coppia[];
    totale: string;
    dopo: Coppia[];
    margine: { testo: string; positivo: boolean } | null;
  } | null;
  campioni: { titolo: string; blocchi: { testa: Coppia; voci: Coppia[]; note?: string | null }[]; totale: string | null } | null;
  piede: string;
}

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <Text style={[s.h3, { borderBottomWidth: 0.5, borderBottomColor: C.line, paddingBottom: 3, marginBottom: 6, color: C.muted, fontSize: 8 }]}>{titolo}</Text>
      {children}
    </View>
  );
}

function Griglia({ campi, colonne = 2 }: { campi: Coppia[]; colonne?: number }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {campi.filter(([, v]) => v).map(([l, v]) => (
        <View key={l} style={{ width: `${100 / colonne}%`, paddingRight: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 7, color: C.light }}>{l}</Text>
          <Text style={s.bold}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function RigaCosto({ a, b, forte, colore }: { a: string; b: string; forte?: boolean; colore?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, ...(forte ? { borderTopWidth: 0.5, borderTopColor: "#FDE68A", marginTop: 3, paddingTop: 4 } : {}) }}>
      <Text style={[forte ? s.bold : {}, colore ? { color: colore } : {}]}>{a}</Text>
      <Text style={[forte ? s.monoBold : s.mono, colore ? { color: colore } : {}]}>{b}</Text>
    </View>
  );
}

function Documento({ d }: { d: DatiSchedaPdf }) {
  return (
    <Document title={`${d.interno ? "Scheda interna" : "Scheda tecnica"} – ${d.nome}`} author="Double U">
      <Page size="A4" style={s.page}>
        <Intestazione titolo={d.interno ? "DOCUMENTO INTERNO RISERVATO" : "SCHEDA TECNICA"} interno={d.interno} />

        <View style={{ marginBottom: 12 }}>
          <Text style={[s.label, { letterSpacing: 1 }]}>{d.sopra}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, marginBottom: 6 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 17, color: C.navy, letterSpacing: 0.5, marginRight: 8 }}>{d.nome.toUpperCase()}</Text>
            <Text style={[s.tag, d.esecutiva ? { backgroundColor: "#DCFCE7", color: "#15803D" } : { backgroundColor: "#F1F5F9", color: "#64748B" }]}>
              {d.esecutiva ? "ESECUTIVA" : "BOZZA"}
            </Text>
          </View>
          <Campi campi={d.testata} />
        </View>

        {d.immagini.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }} wrap={false}>
            {d.immagini.map((img, i) => (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image key={i} src={img} style={{ width: 160, height: 160, objectFit: "contain", marginRight: 10, marginBottom: 10, borderWidth: 0.5, borderColor: C.line, borderRadius: 4, backgroundColor: "#F9FAFB" }} />
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row" }}>
          <View style={{ width: "50%", paddingRight: 10 }}>
            <Sezione titolo="Informazioni articolo"><Griglia campi={d.info} /></Sezione>
          </View>
          <View style={{ width: "50%", paddingLeft: 10 }}>
            <Sezione titolo="Specifiche prodotto">
              <Griglia campi={d.specifiche} />
              {d.noteSpecifiche ? <Text style={{ marginTop: 2 }}><Text style={{ fontSize: 7, color: C.light }}>Note  </Text>{d.noteSpecifiche}</Text> : null}
            </Sezione>
          </View>
        </View>

        {d.loghi.length > 0 && (
          <Sezione titolo="Loghi applicati">
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {d.loghi.map((l, i) => (
                <View key={i} style={{ width: "32%", marginRight: "1.33%", marginBottom: 5, backgroundColor: "#F9FAFB", padding: 6, borderRadius: 3 }}>
                  <Text style={s.bold}>{l.nome}</Text>
                  <Text style={{ fontSize: 7.5, color: C.muted }}>Tecnica: {l.tecnica} · Posizione: {l.posizione}{l.dimensione ? ` · ${l.dimensione}` : ""}</Text>
                  {l.note ? <Text style={{ fontSize: 8, color: C.muted }}>{l.note}</Text> : null}
                </View>
              ))}
            </View>
          </Sezione>
        )}

        {(d.colori.length > 0 || d.notePersonalizzazione) && (
          <Sezione titolo="Colori e personalizzazione">
            <View style={{ flexDirection: "row" }}>
              {d.colori.length > 0 && (
                <View style={{ width: "50%", paddingRight: 10 }}>
                  <Text style={{ fontSize: 7, color: C.light, marginBottom: 3 }}>Abbinamento colori</Text>
                  {d.colori.map((c, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6" }}>
                      <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: c.hex, borderWidth: 0.5, borderColor: "#CCCCCC", marginRight: 5 }} />
                      <Text style={s.bold}>{c.colore}</Text>
                      {c.destinazione ? <Text style={{ fontSize: 8, color: C.light }}>  → {c.destinazione}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
              {d.notePersonalizzazione ? (
                <View style={{ width: "50%" }}>
                  <Text style={{ fontSize: 7, color: C.light, marginBottom: 3 }}>Note personalizzazione</Text>
                  <Text style={{ lineHeight: 1.4 }}>{d.notePersonalizzazione}</Text>
                </View>
              ) : null}
            </View>
          </Sezione>
        )}

        {d.quantita && (
          <Sezione titolo={`Quantità${d.quantita.elastico ? " ed elastico vita" : ""} per taglia — totale ${d.quantita.totale} pz${d.quantita.elastico ? ` · ${d.quantita.elastico.titolo}` : ""}`}>
            {d.quantita.elastico && <Griglia campi={d.quantita.elastico.specifiche} colonne={3} />}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {[...d.quantita.taglie, { taglia: "TOT", q: d.quantita.totale }].map((t) => {
                const tot = t.taglia === "TOT";
                return (
                  <View key={t.taglia} style={{ width: 44, marginRight: 4, marginBottom: 4, borderWidth: 0.5, borderColor: tot ? "#BFDBFE" : C.line, borderRadius: 3 }}>
                    <Text style={{ fontSize: 7.5, textAlign: "center", paddingVertical: 2, backgroundColor: tot ? C.navy : C.head, color: tot ? "#FFFFFF" : C.muted }}>{t.taglia}</Text>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "center", paddingVertical: 3, backgroundColor: tot ? "#DBEAFE" : "#FFFFFF", color: tot ? "#1D4ED8" : C.ink }}>{t.q}</Text>
                    {d.quantita!.elastico && (
                      <Text style={{ fontSize: 7.5, textAlign: "center", paddingVertical: 2, borderTopWidth: 0.5, borderTopColor: C.line, backgroundColor: tot ? "#DBEAFE" : "#FFFFFF", color: tot ? "#1D4ED8" : C.muted }}>
                        {tot ? " " : "elastico" in t && t.elastico && t.elastico !== "—" ? `el. ${t.elastico}` : "—"}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </Sezione>
        )}

        {d.misure && (
          <Sezione titolo={d.misure.titolo}>
            {d.misure.specifiche.length > 0 && <Griglia campi={d.misure.specifiche} colonne={4} />}
            <View style={{ width: d.misure.colonne.length > 2 ? "75%" : "50%" }}>
              <View style={s.th}>
                {["Taglia", ...d.misure.colonne].map((h, i) => <Text key={h} style={[s.thText, { flex: i === 0 ? 0.7 : 1 }, i > 0 ? s.right : {}]}>{h}</Text>)}
              </View>
              {d.misure.righe.map((r) => (
                <View key={r.taglia} style={[s.tr, { paddingVertical: 4 }]}>
                  <Text style={[s.bold, { flex: 0.7 }]}>{r.taglia}</Text>
                  {r.valori.map((v, k) => <Text key={k} style={[s.mono, s.right, { flex: 1 }]}>{v}</Text>)}
                </View>
              ))}
            </View>
          </Sezione>
        )}

        {d.produzione.some(([, v]) => v) && (
          <Sezione titolo="Note di produzione e tolleranze"><Griglia campi={d.produzione} /></Sezione>
        )}

        {d.costi && (
          <View style={{ marginBottom: 14 }} wrap={false}>
            <Text style={{ backgroundColor: "#FEF9C3", borderWidth: 0.5, borderColor: "#FDE047", borderRadius: 3, padding: 5, fontSize: 8, color: "#854D0E", marginBottom: 8 }}>
              DOCUMENTO RISERVATO – Questa sezione contiene informazioni economiche riservate. NON distribuire a produttori, modellisti o sala taglio.
            </Text>
            <Text style={[s.h3, { color: C.muted, fontSize: 8 }]}>Costi interni (solo uso interno)</Text>
            <View style={{ backgroundColor: "#FFFBEB", borderWidth: 0.5, borderColor: "#FDE68A", borderRadius: 4, padding: 8 }}>
              {d.costi.consumi.length > 0 && <Text style={{ fontSize: 7.5, color: "#92400E", fontFamily: "Helvetica-Bold", marginBottom: 2 }}>CONSUMO MATERIALE</Text>}
              {d.costi.consumi.map((c, i) => <RigaCosto key={`c${i}`} a={c.nome} b={c.testo} />)}
              {d.costi.accessori.length > 0 && <Text style={{ fontSize: 7.5, color: "#92400E", fontFamily: "Helvetica-Bold", marginTop: 5, marginBottom: 2 }}>ACCESSORI</Text>}
              {d.costi.accessori.map((a, i) => <RigaCosto key={`a${i}`} a={a.nome} b={a.testo} />)}
              <View style={{ marginTop: 5 }} />
              {d.costi.righe.map(([a, b]) => <RigaCosto key={a} a={a} b={b ?? ""} />)}
              <RigaCosto a="COSTO TOTALE/CAPO" b={d.costi.totale} forte />
              {d.costi.dopo.map(([a, b]) => <RigaCosto key={a} a={a} b={b ?? ""} />)}
              {d.costi.margine && <RigaCosto a="Margine" b={d.costi.margine.testo} colore={d.costi.margine.positivo ? "#15803D" : "#DC2626"} />}
            </View>
          </View>
        )}

        {d.campioni && (
          <View style={{ marginBottom: 14 }} wrap={false}>
            <Text style={[s.h3, { color: C.muted, fontSize: 8 }]}>{d.campioni.titolo}</Text>
            <Text style={{ fontSize: 8, color: C.muted, marginBottom: 5 }}>Costo una tantum di sviluppo dell&apos;articolo: non incluso nel costo per capo né nel margine.</Text>
            <View style={{ backgroundColor: "#EFF4FB", borderWidth: 0.5, borderColor: "#BFDBFE", borderRadius: 4, padding: 8 }}>
              {d.campioni.blocchi.map((b, i) => (
                <View key={i} style={{ marginBottom: 5 }}>
                  <RigaCosto a={b.testa[0]} b={b.testa[1] ?? ""} forte={false} />
                  {b.voci.map(([a, v], j) => <View key={j} style={{ paddingLeft: 8 }}><RigaCosto a={a} b={v ?? ""} /></View>)}
                  {b.note ? <Text style={{ fontSize: 8, color: C.muted, paddingLeft: 8 }}>{b.note}</Text> : null}
                </View>
              ))}
              {d.campioni.totale && <RigaCosto a={`TOTALE SVILUPPO`} b={d.campioni.totale} forte />}
            </View>
          </View>
        )}

        <Piede testo={d.piede} />
      </Page>
    </Document>
  );
}

export const creaPdfScheda = (d: DatiSchedaPdf) => renderToBuffer(<Documento d={d} />);
