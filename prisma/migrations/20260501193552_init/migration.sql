-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "indirizzo" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Logo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Materiale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "composizione" TEXT,
    "peso" TEXT,
    "fornitore" TEXT,
    "costoMetro" REAL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Scheda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codice" TEXT NOT NULL,
    "nomeArticolo" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'bozza',
    "versione" TEXT NOT NULL DEFAULT '1.0',
    "collezione" TEXT,
    "clienteId" TEXT,
    "categoria" TEXT,
    "vestibilita" TEXT,
    "genere" TEXT,
    "stagione" TEXT,
    "utilizzo" TEXT,
    "immagini" TEXT,
    "tessutoPrincipale" TEXT,
    "pesoTessuto" TEXT,
    "coloreBase" TEXT,
    "coloriSecondari" TEXT,
    "collo" TEXT,
    "maniche" TEXT,
    "noteSpecifiche" TEXT,
    "notePersonalizzazione" TEXT,
    "colorePrincipale" TEXT,
    "coloreSecondario" TEXT,
    "tabellaMisure" TEXT,
    "quantitaTaglia" TEXT,
    "noteProduzione" TEXT,
    "tolleranzaTaglio" TEXT,
    "tolleranzaCucitura" TEXT,
    "tolleranzaColore" TEXT,
    "tolleranzaStampa" TEXT,
    "controlloQualita" TEXT,
    "packaging" TEXT,
    "allegati" TEXT,
    "consumoMateriale" TEXT,
    "costoLavorazione" REAL,
    "prezzoVendita" REAL,
    "noteRapide" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'Admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scheda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogoScheda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schedaId" TEXT NOT NULL,
    "logoId" TEXT NOT NULL,
    "posizione" TEXT NOT NULL,
    "tecnica" TEXT NOT NULL,
    "dimensione" TEXT,
    "note" TEXT,
    CONSTRAINT "LogoScheda_schedaId_fkey" FOREIGN KEY ("schedaId") REFERENCES "Scheda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LogoScheda_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Logo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialeScheda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schedaId" TEXT NOT NULL,
    "materialeId" TEXT NOT NULL,
    "consumoPerCapo" REAL,
    "unita" TEXT,
    "note" TEXT,
    CONSTRAINT "MaterialeScheda_schedaId_fkey" FOREIGN KEY ("schedaId") REFERENCES "Scheda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialeScheda_materialeId_fkey" FOREIGN KEY ("materialeId") REFERENCES "Materiale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Scheda_codice_key" ON "Scheda"("codice");
