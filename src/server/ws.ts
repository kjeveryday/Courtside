// WebSocket push (AD-3): token-checked at upgrade (query token — browsers can't
// set headers on WS), same-origin only, broadcast-only channel (server → UI).
import type { IncomingMessage, Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { extractToken, tokenEquals } from './auth.ts';

export function attachWs(httpServer: Server, token: string) {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<WebSocket>();

  httpServer.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = req.url ?? '';
    const authorized =
      url.startsWith('/ws') && tokenEquals(token, extractToken(req.headers.authorization, url));
    if (!authorized) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      clients.add(ws);
      ws.on('close', () => clients.delete(ws));
    });
  });

  return {
    broadcast(message: unknown) {
      const data = JSON.stringify(message);
      for (const ws of clients) if (ws.readyState === ws.OPEN) ws.send(data);
    },
    clientCount: () => clients.size,
    close() {
      for (const ws of clients) ws.terminate();
      wss.close();
    },
  };
}
