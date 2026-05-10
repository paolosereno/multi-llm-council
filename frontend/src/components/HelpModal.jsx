import './HelpModal.css';

const sections = [
  {
    icon: '⚡',
    title: 'Come funziona',
    content: (
      <div className="help-stages">
        <div className="help-stage">
          <span className="help-stage-badge">Stage 1</span>
          <span>Tutti i modelli ricevono la domanda in parallelo e producono una risposta indipendente.</span>
        </div>
        <div className="help-stage">
          <span className="help-stage-badge">Stage 2</span>
          <span>Ogni modello legge le risposte degli altri (anonimizzate come "Response A, B…") e le classifica. Questo impedisce favoritismi.</span>
        </div>
        <div className="help-stage">
          <span className="help-stage-badge">Stage 3</span>
          <span>Il Chairman legge tutto e produce la risposta finale sintetizzata.</span>
        </div>
      </div>
    ),
  },
  {
    icon: '⌨️',
    title: 'Inviare un messaggio',
    content: (
      <ul className="help-list">
        <li><kbd>Enter</kbd> — invia il messaggio</li>
        <li><kbd>Shift</kbd> + <kbd>Enter</kbd> — va a capo senza inviare</li>
        <li>Clicca <strong>+ New Conversation</strong> nella sidebar per iniziare una nuova chat.</li>
      </ul>
    ),
  },
  {
    icon: '📋',
    title: 'Prompt di sistema',
    content: (
      <p>
        Clicca su <strong>System prompt</strong> sopra il campo messaggio per aggiungere istruzioni globali
        (es. lingua, ruolo, vincoli). Il simbolo <strong>●</strong> indica che il prompt è attivo.
        Viene applicato a tutti e tre gli stage e preservato durante il Re-run.
      </p>
    ),
  },
  {
    icon: '🔄',
    title: 'Conversazione multi-turno',
    content: (
      <p>
        Attiva <strong>Include context</strong> sotto il campo messaggio per passare la history della
        conversazione (domande + risposte Stage 3) a tutti gli stage. Utile per domande di
        follow-up. Lascialo disattivato per domande indipendenti (consuma meno token).
      </p>
    ),
  },
  {
    icon: '↺',
    title: 'Re-run',
    content: (
      <p>
        Clicca il pulsante <strong>↺</strong> nell'intestazione di qualsiasi risposta completata per
        rieseguire il council sulla stessa domanda. La risposta precedente viene sostituita.
        Il system prompt originale viene riutilizzato automaticamente.
      </p>
    ),
  },
  {
    icon: '💬',
    title: 'Gestione conversazioni',
    content: (
      <ul className="help-list">
        <li>Cerca per titolo nel campo <strong>Search</strong> della sidebar — il filtro è in tempo reale.</li>
        <li>Clicca <strong>×</strong> accanto a una conversazione per eliminarla.</li>
        <li>Clicca <strong>Export MD</strong> nella barra superiore per scaricare la conversazione come file Markdown.</li>
      </ul>
    ),
  },
  {
    icon: '⚙',
    title: 'Configurazione modelli',
    content: (
      <p>
        Clicca su <strong>⚙</strong> nella sidebar per aprire le Impostazioni. Puoi aggiungere o
        rimuovere modelli del council e cambiare il Chairman inserendo l'identificatore OpenRouter
        (es. <code>openai/gpt-4.1</code>). Le modifiche hanno effetto immediato senza riavviare il server.
      </p>
    ),
  },
  {
    icon: '▤',
    title: 'Statistiche modelli',
    content: (
      <p>
        Clicca su <strong>▤</strong> per vedere le performance storiche di ogni modello: posizione
        media nelle classifiche peer, numero di vittorie e win rate. Usa <strong>Reset Stats</strong> per
        azzerare il conteggio e ricominciare da ora.
      </p>
    ),
  },
  {
    icon: '☀',
    title: 'Tema chiaro / scuro',
    content: (
      <p>
        Clicca su <strong>☾</strong> (o <strong>☀</strong>) in cima alla sidebar per alternare
        tra tema chiaro e scuro. La preferenza viene salvata nel browser.
      </p>
    ),
  },
];

export default function HelpModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Guida rapida</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body help-modal-body">
          {sections.map((s) => (
            <section key={s.title} className="help-section">
              <h3 className="help-section-title">
                <span className="help-section-icon">{s.icon}</span>
                {s.title}
              </h3>
              <div className="help-section-body">{s.content}</div>
            </section>
          ))}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}
