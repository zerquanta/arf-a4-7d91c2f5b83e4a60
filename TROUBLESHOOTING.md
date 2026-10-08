# Diagnostica rapida

## La PWA non compare nel menu Condividi Android

1. Il sito deve essere aperto via HTTPS.
2. Installa davvero la PWA (non basta un normale preferito della home).
3. Chiudi e riapri il browser/app dopo l'installazione.
4. La funzione Web Share Target dipende dal browser/Android e non è disponibile ovunque.

## Il bookmarklet non parte su Android

- Apri prima la pagina Amazon `Centro resi`.
- Digita il **nome del preferito** (`Reso Amazon A4`) nella barra indirizzi e tocca il suggerimento del preferito.
- Non incollare il codice `javascript:` direttamente nella barra indirizzi: Chrome può rimuoverlo o non eseguirlo.
- Se si apre il pannello Return Fixer, usa `Debug` → `Copia debug`.

## La PWA mostra una vecchia versione

- Riapri il sito GitHub Pages online.
- Se compare `Aggiorna ora`, premilo.
- In alternativa chiudi completamente la PWA e riaprila.

## Il PDF non viene corretto automaticamente

L'algoritmo cerca soprattutto immagini A4 originali incorporate nel PDF. Se Amazon cambia completamente formato e non ci sono immagini A4 recuperabili, l'app mostra le pagine originali per selezione manuale. Copia il debug per analizzare il nuovo caso.
