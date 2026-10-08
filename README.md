# Amazon Return Print Fixer — GitHub Pages / PWA

PWA statica, mobile-first, senza backend. Corregge PDF di reso Amazon impaginati male e offre un bookmarklet per stampare direttamente dalla pagina Amazon usando i fogli A4 originali.

## Cosa fa

- PDF già scaricato: cerca le immagini A4 originali incorporate, elimina la dipendenza dall'impaginazione sbagliata di Chrome/Amazon e genera un nuovo PDF A4.
- Pagina Amazon: il bookmarklet `🖨 Reso Amazon A4` trova i fogli originali direttamente nel browser autenticato e apre una vista di stampa pulita.
- Scelta del contenuto: istruzioni, etichette, eventuale foglio interno/barcode, riepilogo articolo e altre pagine.
- Modalità rapide: `Consigliati`, `Solo etichette`, `Tutto`.
- Android: dopo l'installazione PWA può ricevere PDF e link dal menu **Condividi**, se il browser supporta Web Share Target.
- Debug temporaneo sia nella PWA sia nel bookmarklet.

## Privacy

- Il PDF viene elaborato **nel browser** e non viene caricato su GitHub o su un server applicativo.
- Non ci sono API, database, Python, Docker o backend.
- PDF.js 6.4.299 e pdf-lib 1.17.1 sono caricati da CDN con versione fissata; dopo l'uso il service worker prova a servirli dalla cache.
- Il bookmarklet è autonomo e non invia il contenuto Amazon alla PWA.
- `robots.txt` e `noindex` scoraggiano l'indicizzazione. Non sono autenticazione: chi conosce l'URL GitHub Pages può aprire il sito.

## Pubblicazione su GitHub Pages — prima volta

1. Accedi a GitHub e crea un repository **pubblico**. Se vuoi ridurre la scoperta casuale usa un nome lungo, per esempio `arf-a4-7d91c2f5b83e4a60`.
2. Estrai lo ZIP di questa release sul PC.
3. Nel repository premi **Add file → Upload files**.
4. Carica **tutti i file contenuti nella cartella estratta**. `index.html` deve trovarsi nella radice del repository, non in una sottocartella.
5. In fondo alla pagina premi **Commit changes**.
6. Vai in **Settings → Pages**.
7. In **Build and deployment → Source** scegli **Deploy from a branch**.
8. Seleziona branch `main` e cartella `/(root)`, poi **Save**.
9. Dopo uno o pochi minuti GitHub mostrerà un indirizzo tipo `https://TUO-UTENTE.github.io/NOME-REPOSITORY/`.
10. Aprilo sul telefono Android e installa la PWA dal menu del browser o dal pulsante `Installa app` quando compare.

## Aggiornare una versione già pubblicata

Per un aggiornamento manuale semplice:

1. Estrai il nuovo ZIP.
2. Nel repository GitHub carica/sostituisci i file aggiornati nella root.
3. Fai `Commit changes`.
4. GitHub Pages ripubblica automaticamente.
5. Apri una volta il sito online. Se compare la barra **Aggiorna ora**, premila.

## Uso consigliato

### Hai ancora il link del reso

1. Apri Return Fixer → `Link Amazon`.
2. Incolla il link ricevuto da Amazon.
3. Premi `Prepara etichetta Amazon` e poi `Apri Amazon`.
4. Nella pagina `Centro resi` esegui il preferito `🖨 Reso Amazon A4`.
5. Seleziona gli elementi desiderati e usa `Stampa / Salva PDF`.

Questo evita del tutto la normale impaginazione di stampa Amazon.

### Hai già il PDF stampato male

1. Return Fixer → `PDF`.
2. Scegli il PDF oppure condividilo verso la PWA da Android.
3. Controlla le anteprime.
4. Lascia selezionate le etichette e l'eventuale foglio interno.
5. `Crea PDF A4 corretto` → `Apri PDF / Stampa`.

## Bookmarklet Android Chrome

1. Dalla scheda `Bookmarklet` premi `Copia bookmarklet`.
2. Crea un preferito qualsiasi chiamato `Reso Amazon A4`.
3. Modifica il preferito e sostituisci l'URL con il testo copiato.
4. Quando sei nella pagina Amazon, digita `Reso Amazon A4` nella barra indirizzi e seleziona il preferito dai suggerimenti.

Il bookmarklet contiene un suo pannello `Debug`: se qualcosa non va, aprilo e usa `Copia debug`.

## File principali

- `index.html` — UI PWA.
- `app.js` — correzione PDF, Share Target, link Amazon, gestione PWA.
- `bookmarklet-source.js` — sorgente leggibile del bookmarklet.
- `bookmarklet.min.js` — versione su una sola riga usata dalla PWA.
- `sw.js` — service worker, cache e ricezione condivisioni.
- `manifest.webmanifest` — installazione PWA e Share Target Android.
- `privacy.html` — comportamento privacy.
- `TROUBLESHOOTING.md` — problemi comuni.
- `CHANGELOG.md` — modifiche tra versioni.

## Limiti noti

- GitHub Pages non è privato: un URL lungo è solo difficile da indovinare.
- Web Share Target non è supportato da tutti i browser/piattaforme.
- Se Amazon cambia completamente il formato e non incorpora più fogli A4 recuperabili, servirà aggiornare il rilevamento.
- Le librerie PDF arrivano da CDN; il contenuto del PDF non viene inviato ai CDN.
