// Browser-side token handling (AD-6) + state fetch. The token arrives once via
// the printed ?token= URL, is stored locally, and is stripped from the address
// bar; every API call carries it as a Bearer header.
const KEY = 'courtside.token';

export function ensureToken(): string | null {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('token');
  if (fromUrl) {
    localStorage.setItem(KEY, fromUrl);
    url.searchParams.delete('token');
    window.history.replaceState(null, '', url.toString());
  }
  return localStorage.getItem(KEY);
}

export type StatePayload = {
  receivedAt: string;
  result: { ok: true; state: unknown } | { ok: false; errors: string[] };
};

export type FetchStateOutcome =
  | { kind: 'unauthorized' }
  | { kind: 'network'; detail: string }
  | { kind: 'payload'; payload: StatePayload };

export async function fetchState(token: string): Promise<FetchStateOutcome> {
  try {
    const res = await fetch('/api/state', { headers: { authorization: `Bearer ${token}` } });
    if (res.status === 401) return { kind: 'unauthorized' };
    if (!res.ok) return { kind: 'network', detail: `HTTP ${res.status}` };
    return { kind: 'payload', payload: (await res.json()) as StatePayload };
  } catch (err) {
    return { kind: 'network', detail: err instanceof Error ? err.message : String(err) };
  }
}

export type WsStatus = 'connecting' | 'live' | 'lost';

// Broadcast-only live channel with quiet exponential reconnect.
export function connectWs(
  token: string,
  onMessage: (payload: StatePayload) => void,
  onStatus: (status: WsStatus) => void,
): () => void {
  let closed = false;
  let ws: WebSocket | null = null;
  let retry = 0;
  const open = () => {
    if (closed) return;
    onStatus('connecting');
    ws = new WebSocket(`ws://${window.location.host}/ws?token=${token}`);
    ws.onopen = () => {
      retry = 0;
      onStatus('live');
    };
    ws.onmessage = (ev) => onMessage(JSON.parse(String(ev.data)) as StatePayload);
    ws.onclose = () => {
      if (closed) return;
      onStatus('lost');
      setTimeout(open, Math.min(5000, 500 * 2 ** retry++));
    };
  };
  open();
  return () => {
    closed = true;
    ws?.close();
  };
}
