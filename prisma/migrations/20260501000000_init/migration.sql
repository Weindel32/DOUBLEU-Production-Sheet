-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "indirizzo" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Logo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materiale" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "composizione" TEXT,
    "peso" TEXT,
    "fornitore" TEXT,
    "costoMetro" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Materiale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheda" (
    "id" TEXT NOT NULL,
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
    "costoLavorazione" DOUBLE PRECISION,
    "prezzoVendita" DOUBLE PRECISION,
    "noteRapide" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'Admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogoScheda" (
    "id" TEXT NOT NULL,
    "schedaId" TEXT NOT NULL,
    "logoId" TEXT NOT NULL,
    "posizione" TEXT NOT NULL,
    "tecnica" TEXT NOT NULL,
    "dimensione" TEXT,
    "note" TEXT,

    CONSTRAINT "LogoScheda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialeScheda" (
    "id" TEXT NOT NULL,
    "schedaId" TEXT NOT NULL,
    "materialeId" TEXT NOT NULL,
    "consumoPerCapo" DOUBLE PRECISION,
    "unita" TEXT,
    "note" TEXT,

    CONSTRAINT "MaterialeScheda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scheda_codice_key" ON "Scheda"("codice");

-- AddForeignKey
ALTER TABLE "Scheda" ADD CONSTRAINT "Scheda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoScheda" ADD CONSTRAINT "LogoScheda_schedaId_fkey" FOREIGN KEY ("schedaId") REFERENCES "Scheda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogoScheda" ADD CONSTRAINT "LogoScheda_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Logo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialeScheda" ADD CONSTRAINT "MaterialeScheda_schedaId_fkey" FOREIGN KEY ("schedaId") REFERENCES "Scheda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialeScheda" ADD CONSTRAINT "MaterialeScheda_materialeId_fkey" FOREIGN KEY ("materialeId") REFERENCES "Materiale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
