/**
 * API client for the LLM Council backend.
 */

const API_BASE = 'http://localhost:8001';

export const api = {
  /**
   * List all conversations.
   */
  async listConversations() {
    const response = await fetch(`${API_BASE}/api/conversations`);
    if (!response.ok) {
      throw new Error('Failed to list conversations');
    }
    return response.json();
  },

  /**
   * Create a new conversation.
   */
  async createConversation() {
    const response = await fetch(`${API_BASE}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }
    return response.json();
  },

  /**
   * Get a specific conversation.
   */
  async getConversation(conversationId) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`
    );
    if (!response.ok) {
      throw new Error('Failed to get conversation');
    }
    return response.json();
  },

  /**
   * Get aggregate model performance statistics.
   */
  async getStats() {
    const response = await fetch(`${API_BASE}/api/stats`);
    if (!response.ok) throw new Error('Failed to get stats');
    return response.json();
  },

  async getMetrics() {
    const response = await fetch(`${API_BASE}/api/metrics`);
    if (!response.ok) throw new Error('Failed to get metrics');
    return response.json();
  },

  async resetStats() {
    const response = await fetch(`${API_BASE}/api/stats/reset`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to reset stats');
    return response.json();
  },

  /**
   * Get council configuration.
   */
  async getModels() {
    const response = await fetch(`${API_BASE}/api/models`);
    if (!response.ok) throw new Error('Failed to get models');
    return response.json();
  },

  async getConfig() {
    const response = await fetch(`${API_BASE}/api/config`);
    if (!response.ok) throw new Error('Failed to get config');
    return response.json();
  },

  /**
   * Update council configuration.
   */
  async updateConfig(config) {
    const response = await fetch(`${API_BASE}/api/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to update config');
    return response.json();
  },

  /**
   * Delete a conversation.
   */
  async deleteConversation(conversationId) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }
    return response.json();
  },

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId, content) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  },

  /**
   * Send a message and receive streaming updates.
   * @param {string} conversationId - The conversation ID
   * @param {string} content - The message content
   * @param {function} onEvent - Callback function for each event: (eventType, data) => void
   * @returns {Promise<void>}
   */
  async rerunStream(conversationId, content, systemPrompt, executionMode, onEvent) {
    const body = { content };
    if (systemPrompt) body.system_prompt = systemPrompt;
    if (executionMode) body.execution_mode = executionMode;

    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message/rerun`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) throw new Error('Failed to re-run council');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamEnded = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'complete' || event.type === 'error') streamEnded = true;
            onEvent(event.type, event);
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }

    if (!streamEnded) {
      onEvent('error', { type: 'error', message: 'Connection closed unexpectedly.' });
    }
  },

  async sendMessageStream(conversationId, content, systemPrompt, history, executionMode, onEvent) {
    const body = { content };
    if (systemPrompt) body.system_prompt = systemPrompt;
    if (history?.length) body.history = history;
    if (executionMode) body.execution_mode = executionMode;

    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamEnded = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'complete' || event.type === 'error') streamEnded = true;
            onEvent(event.type, event);
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }

    if (!streamEnded) {
      onEvent('error', { type: 'error', message: 'Connection closed unexpectedly.' });
    }
  },
};
