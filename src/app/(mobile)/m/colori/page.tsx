export const dynamic = "force-dynamic";
import Testata from "@/components/mobile/Testata";
import ColoriPerDoubleu from "@/components/materiali/ColoriPerDoubleu";
import { coloriDisponibili } from "@/lib/coloriServer";

/** "Mi serve un bordeaux": in quali tessuti c'è e con quale codice si ordina, dal telefono. */
export default async function ColoriMobile() {
  return (
    <>
      <Testata indietro="/m" sopra="Colori DOUBLEU" titolo="Cerca un colore" />
      <div className="px-4 pb-6">
        <ColoriPerDoubleu disponibili={await coloriDisponibili()} mobile />
      </div>
    </>
  );
}
