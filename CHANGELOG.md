# Changelog

## 0.5.0 — debug

- Debug completo anche **dentro il bookmarklet Amazon**, con pulsante `Copia debug`.
- Bookmarklet più robusto: rileva A4 portrait/landscape, istruzioni, foglio interno/barcode e riepilogo articolo.
- `Vista pulita` separata da `Stampa / Salva PDF`, più affidabile anche da mobile.
- Bookmarklet minificato su una sola riga per facilitarne l'installazione nei preferiti Android.
- Validazione più stretta dei link `/gp/r.html`: anche la destinazione incorporata deve restare su un dominio Amazon consentito.
- Share Target Android con ID univoco, limite PDF 80 MB e pulizia della copia temporanea locale.
- Barra di avanzamento durante analisi ed esportazione PDF.
- Deduplica migliorata delle immagini A4 e indicazione delle pagine sorgente.
- Riconoscimento A4 più tollerante per diverse risoluzioni raster.
- Stima DPI delle etichette recuperate.
- Supporto a fogli A4 landscape, se dovessero comparire.
- Gestione aggiornamenti PWA/service worker con avviso `Aggiorna ora`.
- Stato Online/Offline e Installata/Browser in home.
- Shortcuts PWA per PDF, Link Amazon e Bookmarklet.
- Privacy e documentazione aggiornate.

## 0.4.0

- Prima release GitHub Pages/PWA.
- Correzione PDF client-side, Share Target Android e bookmarklet Amazon.
