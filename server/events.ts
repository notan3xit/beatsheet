import type { ServerResponse } from 'node:http';
import type { Limits } from './limits.ts';

const PING_INTERVAL = 25_000;

export interface Events {
  /** Hält die Antwort offen, bis die Verbindung endet; `false`, wenn eine Grenze erreicht ist. */
  connect(email: string, response: ServerResponse): boolean;
  /** Sendet ein Ereignis an alle Verbindungen der Adressen. Inhalte gehen nie über diesen Kanal. */
  send(emails: readonly string[], event: 'workbook' | 'workbooks', data?: { id: string }): void;
}

/** Ereigniskanal über Server-Sent Events, im Speicher eines Prozesses (design.md D6). */
export function createEvents(limits: Pick<Limits, 'accountConnections' | 'totalConnections'>): Events {
  const connections = new Map<string, Set<ServerResponse>>();
  let total = 0;

  return {
    connect(email, response) {
      if (total >= limits.totalConnections || (connections.get(email)?.size ?? 0) >= limits.accountConnections) return false;
      total++;
      response.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
      response.write(': ping\n\n');
      const own = connections.get(email) ?? new Set();
      connections.set(email, own.add(response));
      const ping = setInterval(() => response.write(': ping\n\n'), PING_INTERVAL);
      ping.unref();
      response.on('close', () => {
        clearInterval(ping);
        total--;
        own.delete(response);
        if (own.size === 0 && connections.get(email) === own) connections.delete(email);
      });
      return true;
    },
    send(emails, event, data = undefined) {
      // Ein Ereignis ohne `data`-Zeile verwirft EventSource
      const message = `event: ${event}\ndata: ${JSON.stringify(data ?? {})}\n\n`;
      for (const email of emails) connections.get(email)?.forEach((response) => response.write(message));
    },
  };
}
