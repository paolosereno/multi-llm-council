# LLM Council - Miglioramenti Proposti

## Alta Priorità

### 1. Configurazione modelli da UI ✅ IMPLEMENTATO
Pannello impostazioni per cambiare council e chairman senza modificare `config.py`.
- Aggiungere/rimuovere modelli dalla lista del council
- Cambiare il chairman
- Persistere la configurazione (backend JSON + runtime in memoria)

### 2. Conversazione multi-turno ✅ IMPLEMENTATO
Toggle "Include context" nel form (default off). Quando attivo, passa la history (domande + risposte Stage 3) a tutti e tre gli stage del council.
- Il form è sempre visibile per permettere follow-up
- Il toggle appare solo dopo il primo messaggio

### 3. Collassa/espandi stages ✅ IMPLEMENTATO
Stage 1 e 2 producono molto testo. Toggle collassa/espandi su ogni stage.
- Stage 1 e 3 partono espansi, Stage 2 parte collassato
- Click sull'header del stage per espandere/collassare

---

## Media Priorità

### 4. Copia risposta
Pulsante per copiare negli appunti il testo di un singolo tab (Stage 1) o la risposta finale (Stage 3), senza dover esportare l'intero file.

### 5. Riesegui council ✅ IMPLEMENTATO
Pulsante ↺ Re-run su ogni risposta completata del council.
- Riesegue il council sulla stessa domanda, sostituendo la risposta precedente
- Il system prompt originale viene preservato e riutilizzato automaticamente

### 6. Prompt di sistema personalizzato ✅ IMPLEMENTATO
Campo opzionale per fornire contesto al council prima della domanda.
- Textarea collassabile sopra il campo messaggio
- Applicato a tutti e 3 gli stage (system message nelle API calls)
- Indicatore visivo (●) quando il prompt è impostato

---

## Bassa Priorità

### 7. Ricerca nelle conversazioni ✅ IMPLEMENTATO
Campo di ricerca nella sidebar, filtra in tempo reale per titolo. Mostra "No results" se nessuna conversazione corrisponde.

### 8. Statistiche modelli ✅ IMPLEMENTATO
Pulsante ▤ nella sidebar apre un modal con la tabella delle performance storiche per modello.
- Colonne: Runs, Avg Rank, Wins, Win Rate
- Calcolate su tutte le conversazioni salvate ricostruendo il mapping label→model dai dati stage1
- Il modello in testa è evidenziato
