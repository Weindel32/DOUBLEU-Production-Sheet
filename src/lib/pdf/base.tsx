// Pezzi comuni dei PDF Double U (react-pdf, generati sul server): intestazione, campi, piè di pagina.
// Font standard Helvetica/Courier: niente file da caricare, accenti ed € inclusi.

import { StyleSheet, Text, View } from "@react-pdf/renderer";

export const C = {
  navy: "#1A2236", ink: "#1A1A1A", muted: "#666666", light: "#999999", line: "#E5E7EB",
  head: "#F4F6F9", warn: "#A8461F", verde: "#009246", rosso: "#CE2B37",
};

export const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 48, paddingHorizontal: 32, fontFamily: "Helvetica", fontSize: 10, color: C.ink },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, marginBottom: 14, borderBottomWidth: 2, borderBottomColor: C.navy },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 16, letterSpacing: 2, color: C.navy },
  brandSub: { fontSize: 7, letterSpacing: 3, color: C.muted, marginTop: 2 },
  flag: { flexDirection: "row", marginTop: 4 },
  stripe: { width: 16, height: 2.5, marginRight: 2 },
  tag: { fontFamily: "Helvetica-Bold", fontSize: 7, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 3 },
  small: { fontSize: 8, color: C.muted },
  meta: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  metaItem: { marginRight: 24, marginBottom: 4 },
  label: { fontSize: 7, color: C.light, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 1 },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: C.navy, marginBottom: 8 },
  bold: { fontFamily: "Helvetica-Bold" },
  mono: { fontFamily: "Courier" },
  monoBold: { fontFamily: "Courier-Bold" },
  right: { textAlign: "right" },
  th: { flexDirection: "row", backgroundColor: C.head, paddingVertical: 5, paddingHorizontal: 6 },
  thText: { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.line },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: C.light, borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 6 },
  note: { fontSize: 8, color: C.muted, marginTop: 10 },
});

export function Intestazione({ titolo, interno }: { titolo: string; interno: boolean }) {
  return (
    <View style={s.header}>
      <View>
        <Text style={s.brand}>DOUBLE U</Text>
        <Text style={s.brandSub}>HANDCRAFTED IN ITALY</Text>
        <View style={s.flag}>
          <View style={[s.stripe, { backgroundColor: C.verde }]} />
          <View style={[s.stripe, { backgroundColor: "#FFFFFF", borderWidth: 0.5, borderColor: "#DDDDDD" }]} />
          <View style={[s.stripe, { backgroundColor: C.rosso }]} />
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[s.tag, interno ? { backgroundColor: "#FEF3C7", color: "#92400E" } : { backgroundColor: "#DBEAFE", color: "#1D4ED8" }]}>{titolo}</Text>
        <Text style={[s.small, { marginTop: 5 }]}>Data: {new Date().toLocaleDateString("it-IT")}</Text>
      </View>
    </View>
  );
}

export function Campi({ campi }: { campi: [string, string | null | undefined][] }) {
  return (
    <View style={s.meta}>
      {campi.filter(([, v]) => v).map(([l, v]) => (
        <View key={l} style={s.metaItem}>
          <Text style={s.label}>{l}</Text>
          <Text style={s.value}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

export function Piede({ testo }: { testo: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>Double U – Handcrafted in Italy · {testo}</Text>
      <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} di ${totalPages}`} />
    </View>
  );
}
