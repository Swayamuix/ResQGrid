type SSECallback = (data: { event: string; payload: unknown }) => void;

class AgentEventHub {
  private subscribers: Set<SSECallback> = new Set();

  subscribe(callback: SSECallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  broadcast(event: string, payload: unknown) {
    this.subscribers.forEach((callback) => {
      try {
        callback({ event, payload });
      } catch (err) {
        console.error('SSE broadcast error:', err);
      }
    });
  }
}

export const agentEventHub = new AgentEventHub();
