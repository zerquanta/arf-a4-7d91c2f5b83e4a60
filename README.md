# Amazon Return Print Fixer — GitHub Pages / PWA

PWA statica, mobile-first, senza backend. Corregge PDF di reso Amazon impaginati male e offre un bookmarklet per stampare direttamente dalla pagina Amazon usando i fogli A4 originali.

## Privacy

- Il PDF viene elaborato **nel browser** e non viene caricato su GitHub o su un server applicativo.
- Non ci sono API, database, Python, Docker o backend.
- PDF.js 6.4.299 e pdf-lib 1.17.1 sono caricati da CDN con versione fissata; dopo il primo uso la PWA prova a servirli dalla cache.
- `robots.txt` e `noindex` chiedono ai motori di ricerca di non indicizzare il sito. Questo **non è autenticazione**: chi conosce l'URL può aprire la pagina.

## Funzioni

- Upload/apertura PDF da PC o telefono.
- Share Target Android per ricevere PDF e link dalla funzione **Condividi** (dopo installazione PWA, se supportato dal browser).
- Estrazione delle immagini A4 incorporate nel PDF e ricostruzione senza tagli/deformazioni.
- Scelta di cosa esportare: istruzioni, etichette, eventuale foglio interno/barcode, riepilogo articolo e altre pagine.
- Modalità rapide: **Consigliati**, **Solo etichette**, **Tutto**.
- Generazione PDF A4 interamente client-side.
- Bookmarklet `🖨 Reso Amazon A4` per lavorare direttamente nella pagina Amazon già autenticata.
- Debug temporaneo con redazione di token/query/identificatori sensibili.

## Pubblicazione su GitHub Pages — metodo semplice

1. Crea un repository GitHub **pubblico** con un nome lungo/casuale, ad esempio `arf-a4-4c7e91d6b83f`.
2. Carica **il contenuto di questa cartella nella radice del repository**. `index.html` deve stare nella root, non dentro una sottocartella.
3. Apri **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**.
5. Branch: `main`. Folder: `/(root)`. Premi **Save**.
6. Attendi il deployment. L'URL sarà circa `https://TUO-UTENTE.github.io/arf-a4-4c7e91d6b83f/`.
7. Apri l'URL su Android e installa la PWA dal menu del browser oppure dal pulsante **Installa app**, quando disponibile.

Il file `.nojekyll` è già incluso per pubblicare i file così come sono.

## Aggiornamenti

Sostituisci i file del repository con quelli della nuova release e fai commit. GitHub Pages ripubblica automaticamente la versione aggiornata. Se il telefono mostra ancora la vecchia PWA, riapri il sito online una volta e poi chiudi/riapri l'app.

## Nota sul link “segreto”

Un URL lungo e `noindex` riducono la scoperta casuale, ma GitHub Pages standard non rende il sito privato. Inoltre, con GitHub Free il repository usato per Pages deve normalmente essere pubblico. Non inserire nel repository PDF, etichette, token Amazon o altri dati personali.
