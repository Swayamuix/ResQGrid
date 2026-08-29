import { NextRequest } from 'next/server';
import { agentEventHub } from '@/lib/agents/eventStream';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial heartbeat
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'STREAM_CONNECTED', time: new Date().toISOString() })}\n\n`)
      );

      // 2. Subscribe to Agent Event Hub
      const unsubscribe = agentEventHub.subscribe(({ event, payload }) => {
        try {
          const sseChunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(sseChunk));
        } catch {
          // Closed stream
        }
      });

      // 3. Keepalive ping every 25s to avoid proxy timeout
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25000);

      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
