# LLM Council - Miglioramenti Proposti

## Alta Priorità

### 1. Configurazione modelli da UI ✅ IMPLEMENTATO
Pannello impostazioni per cambiare council e chairman senza modificare `config.py`.
- Aggiungere/rimuovere modelli dalla lista del council
- Cambiare il chairman
- Persistere la configurazione (backend JSON + runtime in memoria)

### 2. Conversazione multi-turno
Attualmente ogni domanda è indipendente. Passare la history ai modelli renderebbe l'app molto più potente per approfondimenti e follow-up.
- Includere i messaggi precedenti nel contesto inviato ai modelli
- Gestire il troncamento della history per rispettare i limiti di contesto

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

### 7. Ricerca nelle conversazioni
Filtro testuale nella sidebar per trovare rapidamente conversazioni passate per titolo o contenuto.

### 8. Statistiche modelli
Tracciare nel tempo quali modelli vengono più spesso premiati nei ranking di Stage 2.
- Dashboard con punteggi aggregati storici
- Grafici di performance per modello
