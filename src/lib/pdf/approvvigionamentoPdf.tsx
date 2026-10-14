// PDF approvvigionamento di un ordine: interno (dettaglio per referenza + totale con stime)
// o lista acquisti da portare dal fornitore (una pagina ciascuno: articolo, colore, quantità; niente prezzi né club).

import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { AcquistiOrdine } from "@/lib/approvvigionamentoServer";
import { quantitaAcquisto } from "@/lib/approvvigionamento";
import { SCARTO_ACQUISTO, formatEuro, statoOrdine } from "@/lib/utils";
import { C, Campi, Intestazione, Piede, s } from "@/lib/pdf/base";

type Gruppo = AcquistiOrdine["riepilogo"]["fornitori"][number];

const num1 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });
const num2 = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 2 });

/** Colonne: larghezze in % per interno (con netto e stima) e fornitore. */
const COL_INT = ["30%", "28%", "17%", "11%", "14%"];
const COL_FOR = ["40%", "42%", "18%"];

function TabellaFornitore({ g, interno }: { g: Gruppo; interno: boolean }) {
  const w = interno ? COL_INT : COL_FOR;
  const intest = interno ? ["Articolo", "Colore", "Netto", "Quantità", "Stima"] : ["Articolo", "Colore", "Quantità"];
  return (
    <View>
      <View style={s.th}>
        {intest.map((h, i) => <Text key={h} style={[s.thText, { width: w[i] }, i >= 2 ? s.right : {}]}>{h}</Text>)}
      </View>
      {g.righe.map((r, i) => {
        const a = r.acquisto;
        const celle = [
          <View key="a" style={{ width: w[0], paddingRight: 6 }}>
            <Text style={s.bold}>{r.materiale.nome}</Text>
            {r.materiale.codice ? <Text style={s.small}>art. {r.materiale.codice}</Text> : null}
          </View>,
          <Text key="c" style={{ width: w[1], paddingRight: 6, color: r.coloreEtichetta ? C.ink : C.warn }}>{r.coloreEtichetta ?? "da definire"}</Text>,
          ...(interno ? [
            <Text key="n" style={[s.mono, s.right, { width: w[2], color: C.muted, fontSize: 8.5 }]}>
              {a?.unita === "kg" ? `${num1(a.metri!)} m = ${num1(a.netto)} kg` : `${num1(r.quantitaNetta)} ${a?.unita ?? "m"}`}
            </Text>,
          ] : []),
          <Text key="q" style={[s.monoBold, s.right, { width: w[interno ? 3 : 2], fontSize: 12, color: a ? C.ink : C.warn }]}>
            {a ? quantitaAcquisto(a) : "manca peso"}
          </Text>,
          ...(interno ? [
            <Text key="e" style={[s.mono, s.right, { width: w[4], color: a?.stima != null ? C.ink : C.warn }]}>
              {a?.stima != null ? formatEuro(a.stima) : "manca prezzo"}
            </Text>,
          ] : []),
        ];
        return <View key={i} style={s.tr} wrap={false}>{celle}</View>;
      })}
      {interno && (
        <View style={[s.tr, { borderBottomWidth: 0 }]}>
          <Text style={[s.bold, s.right, { width: "86%" }]}>
            Totale {g.fornitore || "fornitore"}{g.senzaPrezzo ? ` (${g.senzaPrezzo} senza prezzo)` : ""}
          </Text>
          <Text style={[s.monoBold, s.right, { width: "14%" }]}>{formatEuro(g.stima)}</Text>
        </View>
      )}
    </View>
  );
}

function Documento({ dati, interno }: { dati: AcquistiOrdine; interno: boolean }) {
  const { ordineId, ordine, cliente, riepilogo } = dati;
  const piede = `Approvvigionamento ${ordineId}`;

  if (!interno)
    return (
      <Document title={`Lista acquisti ${ordineId}`} author="Double U">
        {riepilogo.fornitori.map((g) => (
          <Page key={g.fornitore || "nessuno"} size="A4" style={s.page}>
            <Intestazione titolo="LISTA ACQUISTI" interno={false} />
            <Campi campi={[["Fornitore", g.fornitore || "Fornitore non indicato"], ["Rif. ordine DOUBLEU", ordineId]]} />
            <TabellaFornitore g={g} interno={false} />
            <Text style={s.note}>Quantità da acquistare per l&apos;ordine DOUBLEU indicato: tessuti con il {SCARTO_ACQUISTO * 100}% di scarto, arrotondati per eccesso.</Text>
            <Piede testo={piede} />
          </Page>
        ))}
      </Document>
    );

  const stimati = riepilogo.referenze.some((d) => d.stimati);
  return (
    <Document title={`Approvvigionamento ${ordineId} – interno`} author="Double U">
      <Page size="A4" style={s.page}>
        <Intestazione titolo="DOCUMENTO INTERNO RISERVATO" interno />
        <Campi campi={[["Club", cliente], ["Ordine DOUBLEU", ordineId], ["Stato ordine", ordine?.stato ? statoOrdine(ordine.stato) : null]]} />

        <Text style={s.h3}>Dettaglio per referenza <Text style={[s.small, { textTransform: "none", letterSpacing: 0 }]}>(netto, senza scarto)</Text></Text>
        {riepilogo.referenze.map((d) => (
          <View key={d.id} style={{ borderWidth: 0.5, borderColor: C.line, borderRadius: 4, marginBottom: 8 }} wrap={false}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "#F9FAFB", paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.line }}>
              <Text style={s.bold}>{d.nomeArticolo}</Text>
              <Text style={[s.mono, s.small]}>{d.codice} · {d.capi} capi{d.stimati ? " stimati" : ""}</Text>
            </View>
            {d.righe.map((r, i) => {
              const n = r.netto;
              return (
                <View key={i} style={[s.tr, i === d.righe.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={[s.bold, { width: "30%", paddingRight: 6 }]}>{r.materiale.nome}</Text>
                  <Text style={{ width: "28%", paddingRight: 6, color: r.coloreEtichetta ? C.ink : C.warn }}>{r.coloreEtichetta ?? "da definire"}</Text>
                  <Text style={[s.small, { width: "14%" }]}>{num2(r.consumoPerCapo)} {n?.unita === "pz" ? "pz" : "m"}/capo</Text>
                  <Text style={[s.mono, s.right, { width: "14%", fontSize: 9 }]}>
                    {!n ? `${num1(r.quantita)} m` : n.unita === "kg" ? `${num1(n.metri!)} m = ${num1(n.netto)} kg` : `${num1(n.netto)} ${n.unita}`}
                  </Text>
                  <Text style={[s.mono, s.right, { width: "14%", color: C.muted }]}>{n?.costo != null ? formatEuro(n.costo) : ""}</Text>
                </View>
              );
            })}
          </View>
        ))}
        {riepilogo.escluse.length > 0 && (
          <Text style={[s.note, { color: C.warn, marginTop: 2 }]}>
            Fuori dal conto: {riepilogo.escluse.map((e) => `${e.nomeArticolo} (${e.motivo})`).join("; ")}
          </Text>
        )}

        <Text style={[s.h3, { marginTop: 16 }]}>
          Totale da acquistare <Text style={[s.small, { textTransform: "none", letterSpacing: 0 }]}>(tessuti +{SCARTO_ACQUISTO * 100}% di scarto, arrotondati per eccesso)</Text>
        </Text>
        {riepilogo.fornitori.map((g) => (
          <View key={g.fornitore || "nessuno"} style={{ marginBottom: 12 }} wrap={false}>
            <Text style={[s.bold, { fontSize: 12, color: C.navy, marginBottom: 5 }]}>{g.fornitore || "Fornitore non indicato"}</Text>
            <TabellaFornitore g={g} interno />
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 2, borderTopColor: C.navy, paddingTop: 7, marginTop: 4 }} wrap={false}>
          <Text style={[s.bold, { fontSize: 12 }]}>
            Totale acquisti stimato{riepilogo.senzaPrezzo ? ` (${riepilogo.senzaPrezzo} senza prezzo, esclusi)` : ""}
          </Text>
          <Text style={[s.monoBold, { fontSize: 12 }]}>{formatEuro(riepilogo.totale)}</Text>
        </View>
        <Text style={s.note}>
          Stime sui prezzi in anagrafica materiali.{stimati ? " Capi \"stimati\": presi dall'ordine, taglie non ancora arrivate: conto provvisorio." : ""}
        </Text>
        <Piede testo={piede} />
      </Page>
    </Document>
  );
}

export const creaPdfApprovvigionamento = (dati: AcquistiOrdine, interno: boolean) =>
  renderToBuffer(<Documento dati={dati} interno={interno} />);
