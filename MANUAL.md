# LLM Council — Manuale Utente

## Indice

1. [Cos'è LLM Council](#cosè-llm-council)
2. [Panoramica dell'interfaccia](#panoramica-dellinterfaccia)
3. [Inviare una domanda](#inviare-una-domanda)
4. [Leggere i risultati](#leggere-i-risultati)
   - [Stage 1 — Prime opinioni](#stage-1--prime-opinioni)
   - [Stage 2 — Revisione tra pari](#stage-2--revisione-tra-pari)
   - [Stage 3 — Risposta finale](#stage-3--risposta-finale)
5. [Prompt di sistema](#prompt-di-sistema)
6. [Conversazione multi-turno](#conversazione-multi-turno)
7. [Rieseguire il council](#rieseguire-il-council)
8. [Gestione delle conversazioni](#gestione-delle-conversazioni)
9. [Configurazione dei modelli](#configurazione-dei-modelli)
10. [Statistiche dei modelli](#statistiche-dei-modelli)
11. [Tema chiaro / scuro](#tema-chiaro--scuro)

---

## Cos'è LLM Council

LLM Council è un'applicazione web locale che invia la tua domanda a più modelli linguistici in parallelo, li fa discutere tra loro in modo anonimo, e produce una risposta finale elaborata da un modello "chairman" designato.

Il processo si articola in tre fasi:

| Fase | Cosa succede |
|------|-------------|
| **Stage 1** | Tutti i modelli del council ricevono la domanda indipendentemente e producono una risposta. |
| **Stage 2** | Ogni modello riceve le risposte degli altri (anonimizzate come "Response A", "B", ecc.) e le classifica per accuratezza e profondità. |
| **Stage 3** | Il chairman legge tutto — risposte e classifiche — e sintetizza la risposta definitiva. |

L'anonimizzazione nello Stage 2 impedisce ai modelli di favorire se stessi o i competitor noti.

---

## Panoramica dell'interfaccia

```
┌─────────────────────┬──────────────────────────────────────────┐
│      SIDEBAR        │           AREA CHAT                      │
│                     │                                          │
│  [LLM Council]  ☀▤⚙│  Messaggi della conversazione corrente   │
│                     │                                          │
│  + New Conversation │  ┌──────────────────────────────────┐    │
│                     │  │ Stage 1 ▾   Stage 2 ▾   Stage 3 │    │
│  🔍 Cerca...        │  └──────────────────────────────────┘    │
│                     │                                          │
│  Conversazione 1    │  [System prompt (opzionale)]             │
│  Conversazione 2    │  [Campo messaggio          ] [Invia]     │
│  ...                │  [ ] Include context                     │
└─────────────────────┴──────────────────────────────────────────┘
```

**Sidebar** — lista delle conversazioni, ricerca, accesso a impostazioni (⚙), statistiche (▤) e toggle tema (☀/☾).

**Area chat** — mostra i messaggi della conversazione selezionata e il form per inviare nuove domande.

---

## Inviare una domanda

1. Clicca **+ New Conversation** nella sidebar per aprire una nuova conversazione, oppure selezionane una esistente.
2. Digita la domanda nel campo di testo in basso. Usa **Enter** per inviare, **Shift+Enter** per andare a capo.
3. Attendi che il council completi le tre fasi. Un indicatore di progresso mostra quale stage è in esecuzione.

---

## Leggere i risultati

Ogni risposta del council è composta da tre stage espandibili/collassabili. Clicca sull'intestazione di uno stage per aprirlo o chiuderlo.

### Stage 1 — Prime opinioni

Mostra le risposte individuali di ogni modello in una **vista a tab**. Clicca sul nome del modello per leggere la sua risposta. Utile per confrontare gli approcci prima che intervengano le valutazioni incrociate.

### Stage 2 — Revisione tra pari

Mostra la valutazione di ogni modello sulle risposte altrui. La vista a tab presenta:

- Il **testo grezzo** della valutazione (quello che il modello ha realmente scritto).
- La **classifica estratta** (`1. Response B → 2. Response A → ...`) ricavata dal testo, per validare l'interpretazione del sistema.
- La **classifica aggregata** in fondo, con posizione media e numero di voti per ogni modello.

> I nomi dei modelli compaiono in grassetto nell'interfaccia solo per leggibilità. Durante la valutazione i modelli non conoscevano le identità altrui.

Stage 2 parte **collassato** di default perché produce molto testo; aprilo quando vuoi verificare il ragionamento della giuria.

### Stage 3 — Risposta finale

La risposta sintetizzata dal chairman. Parte **espansa** di default ed è la risposta principale da leggere.

---

## Prompt di sistema

Il prompt di sistema permette di fornire contesto, istruzioni di ruolo o vincoli che si applicano a tutte e tre le fasi del council.

**Come usarlo:**

1. Clicca su **System prompt** sopra il campo messaggio per espandere la textarea.
2. Scrivi le istruzioni (es. *"Rispondi sempre in italiano"*, *"Sei un esperto di diritto tributario"*).
3. Un indicatore **●** compare accanto all'etichetta quando il prompt è attivo.

Il prompt viene inviato come messaggio di sistema a ogni chiamata API, incluse quelle di Stage 2 e Stage 3. Viene preservato automaticamente quando usi il pulsante Re-run.

---

## Conversazione multi-turno

Di default ogni domanda viene inviata al council senza contesto delle domande precedenti. Attivando **Include context**, la history viene passata a tutti e tre gli stage, permettendo follow-up coerenti.

**Come attivarlo:**

- Spunta il toggle **Include context** sotto il campo messaggio (disponibile dopo il primo messaggio).
- La history inclusa è composta da: domanda utente + risposta Stage 3 di ogni turno precedente.

> Tenere il contesto attivo aumenta il costo in token di ogni richiesta. Disattivalo per domande indipendenti.

---

## Rieseguire il council

Se la risposta non è soddisfacente, puoi chiedere al council di rispondere di nuovo alla stessa domanda.

**Come farlo:**

- Clicca il pulsante **↺** nell'intestazione di qualsiasi risposta completata.
- Il council riparte dallo Stage 1 con gli stessi parametri (domanda e system prompt originali).
- La risposta precedente viene sostituita con quella nuova.

---

## Gestione delle conversazioni

| Azione | Come fare |
|--------|-----------|
| **Nuova conversazione** | Pulsante **+ New Conversation** in cima alla sidebar |
| **Cambiare conversazione** | Clic sul nome nella sidebar |
| **Cercare** | Digita nel campo di ricerca — filtra in tempo reale per titolo |
| **Eliminare** | Clic sul pulsante **×** a destra del nome della conversazione |
| **Esportare in Markdown** | Pulsante **Export MD** nella barra superiore della chat |

---

## Configurazione dei modelli

Clicca su **⚙** nella sidebar per aprire il pannello Impostazioni.

- **Council models** — lista dei modelli che partecipano agli Stage 1 e 2. Puoi aggiungere un modello inserendo il suo identificatore OpenRouter (es. `openai/gpt-4.1`) e cliccando **Add**, oppure rimuoverne uno con il pulsante **×**.
- **Chairman model** — il modello usato per lo Stage 3. Modifica il campo e salva.

Clicca **Save** per applicare le modifiche. Le nuove impostazioni hanno effetto immediato, senza riavviare il server.

Gli identificatori dei modelli disponibili si trovano su [openrouter.ai/models](https://openrouter.ai/models).

---

## Statistiche dei modelli

Clicca su **▤** nella sidebar per aprire il pannello Statistiche.

La tabella mostra le performance storiche di ogni modello calcolate su tutte le conversazioni salvate:

| Colonna | Significato |
|---------|-------------|
| **#** | Posizione in classifica |
| **Model** | Identificatore del modello |
| **Runs** | Numero di volte in cui il modello ha partecipato come membro del council |
| **Avg Rank** | Posizione media nelle classifiche dei pari (più bassa = migliore) |
| **Wins** | Numero di volte classificato al primo posto dai pari |
| **Win Rate** | Percentuale di valutazioni in cui è arrivato primo |

Il modello in testa è evidenziato.

**Resettare le statistiche:** clicca **Reset Stats** per ignorare tutti i dati precedenti e ricominciare il conteggio dalla data corrente. Le conversazioni passate non vengono eliminate, semplicemente non rientrano più nel calcolo.

---

## Tema chiaro / scuro

Clicca sul pulsante **☾** (o **☀** in tema chiaro) in cima alla sidebar per alternare tra tema chiaro e scuro. La preferenza viene salvata automaticamente nel browser.
