export interface TabellaTaglie {
  [taglia: string]: {
    torace?: number;
    lunghezza?: number;
    spalla?: number;
    lungManica?: number;
    fianchi?: number;
    vita?: number;
  };
}

export interface QuantitaTaglia {
  [taglia: string]: number;
}

export interface ElasticoVita {
  materialeId: string;
  altezza: number;
  misure: Record<string, number>;
}

export interface ConsumoMateriale {
  materialeId: string;
  nomeM: string;
  consumoPerCapo: number;
  unita: string;
  costoUnitario?: number;
}

export interface SchedaCompleta {
  id: string;
  codice: string;
  nomeArticolo: string;
  stato: string;
  versione: string;
  collezione?: string;
  cliente?: { id: string; nome: string } | null;
  clienteId?: string | null;
  categoria?: string | null;
  vestibilita?: string | null;
  genere?: string | null;
  stagione?: string | null;
  utilizzo?: string | null;
  immagini?: string[] | null;
  tessutoPrincipale?: string | null;
  pesoTessuto?: string | null;
  altezzaTessuto?: string | null;
  modellista?: string | null;
  fornitoreTessuto?: string | null;
  produttore?: string | null;
  coloreBase?: string | null;
  coloriSecondari?: string | null;
  collo?: string | null;
  maniche?: string | null;
  noteSpecifiche?: string | null;
  notePersonalizzazione?: string | null;
  colorePrincipale?: string | null;
  coloreSecondario?: string | null;
  tabellaMisure?: TabellaTaglie | null;
  quantitaTaglia?: QuantitaTaglia | null;
  noteProduzione?: string | null;
  tolleranzaTaglio?: string | null;
  tolleranzaCucitura?: string | null;
  tolleranzaColore?: string | null;
  tolleranzaStampa?: string | null;
  controlloQualita?: string | null;
  packaging?: string | null;
  allegati?: string[] | null;
  consumoMateriale?: ConsumoMateriale[] | null;
  elasticoVita?: ElasticoVita | null;
  costoLavorazione?: number | null;
  costoTaglio?: number | null;
  costoCucitura?: number | null;
  costoStampa?: number | null;
  costoRicamo?: number | null;
  prezzoVendita?: number | null;
  noteRapide?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  loghi?: LogoSchedaCompleto[];
  materiali?: MaterialeSchedaCompleto[];
}

export interface LogoSchedaCompleto {
  id: string;
  logoId: string;
  posizione: string;
  tecnica: string;
  dimensione?: string | null;
  note?: string | null;
  logo: { id: string; nome: string; file: string; tipo: string };
}

export interface MaterialeSchedaCompleto {
  id: string;
  materialeId: string;
  consumoPerCapo?: number | null;
  unita?: string | null;
  note?: string | null;
  materiale: { id: string; nome: string; tipo: string; costoMetro?: number | null };
}
