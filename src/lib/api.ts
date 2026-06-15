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

export type GateMetaItem = {
  label: string;
  provenance: 'verified' | 'claimed';
  artifactRef?: string;
};

export type GatePayloadFile = {
  title?: string;
  sourceRef?: string;
  tldr?: string;
  meta?: GateMetaItem[];
  reportMd?: string;
};

export type DecidedInfo = {
  decision: 'approve' | 'reject' | 'request_changes';
  comment?: string;
  decidedAt?: string;
  seq?: number;
};

export type TapeFrameView = {
  ref: string;
  exists: boolean;
  mtime?: string;
  size?: number;
  url?: string;
};

export type GateView = {
  gate: {
    id: string;
    type: string;
    status: string;
    postedAt: string;
    taskId?: string;
    payloadRef?: string;
    commit?: string;
    tape?: string[];
    verifySteps?: { text: string; criterionRef?: string }[];
  };
  payload?: GatePayloadFile;
  payloadMissing?: boolean;
  payloadNote?: string;
  decided?: DecidedInfo;
  tape?: TapeFrameView[];
};

export type PendingDispatch = { kind: 'task' | 'question'; id: string };
export type AgentRun = {
  id: string;
  kind: string;
  startedAt: string;
  status: 'running' | 'exited' | 'failed';
  exitCode?: number;
  logFile: string;
};
// Events the server observed itself (dispatches, agent runs, refusals) —
// verified by construction, merged into the ticker alongside plan events.
export type ServerEvent = {
  ts: string;
  kind: string;
  provenance: 'verified' | 'claimed';
  text: string;
};

export type SetupInfo = {
  root: string;
  projectName: string;
  mdFiles: string[];
  hasProjectGodot: boolean;
  hasClaudeMd: boolean;
  hasFrameworkDoc: boolean;
};

// candidate-folder preflight for the wizard's "where" field
export async function fetchSetupInfo(
  token: string,
  dir: string,
): Promise<{ ok: true; info: SetupInfo } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/setup/info?dir=${encodeURIComponent(dir)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await res.json().catch(() => ({}))) as { info?: SetupInfo; error?: string };
    if (!res.ok || !data.info) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true, info: data.info };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type StatePayload = {
  receivedAt: string;
  harness?: boolean;
  agentConfigured?: boolean;
  repoUrl?: string;
  // true only on the HTTP fetch that reopened a sitting (>30 min away)
  coldReturn?: boolean;
  // a project with no plan yet: render the setup wizard, not the refusal
  setup?: boolean;
  setupInfo?: SetupInfo;
  result: { ok: true; state: unknown } | { ok: false; errors: string[] };
  gates?: GateView[];
  dispatches?: PendingDispatch[];
  agentRuns?: AgentRun[];
  serverEvents?: ServerEvent[];
};

export type SetupAnswers = {
  dir?: string;
  projectName: string;
  gddMode: 'have' | 'text' | 'folder';
  gddPath?: string;
  gddText?: string;
  gddDir?: string;
  engine?: 'godot' | 'unity' | 'none';
  agentCmd?: string;
};

export async function postSetup(
  token: string,
  answers: SetupAnswers,
): Promise<{ ok: true; written: string[]; kept: string[] } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(answers),
    });
    const data = (await res.json().catch(() => ({}))) as {
      written?: string[];
      kept?: string[];
      error?: string;
    };
    if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true, written: data.written ?? [], kept: data.kept ?? [] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function postTestAgent(
  token: string,
  agentCmd: string,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch('/api/setup/test-agent', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ agentCmd }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      detail?: string;
      error?: string;
    };
    if (!res.ok) return { ok: false, detail: data.error ?? `HTTP ${res.status}` };
    return { ok: data.ok ?? false, detail: data.detail ?? '' };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchGddFolderInfo(
  token: string,
  dir: string,
): Promise<{ ok: true; count: number; files: string[] } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/wizard/gdd-folder-info?dir=${encodeURIComponent(dir)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await res.json().catch(() => ({}))) as {
      count?: number;
      files?: string[];
      error?: string;
    };
    if (!res.ok || data.count === undefined)
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true, count: data.count, files: data.files ?? [] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function pickWizardFolder(token: string): Promise<string | null> {
  try {
    const res = await fetch('/api/wizard/pick-folder', {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await res.json().catch(() => ({}))) as { path?: string | null };
    return typeof data.path === 'string' ? data.path : null;
  } catch {
    return null;
  }
}

export async function pickWizardFile(
  token: string,
): Promise<{ path: string; content: string } | null> {
  try {
    const res = await fetch('/api/wizard/pick-file', {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = (await res.json().catch(() => ({}))) as {
      path?: string | null;
      content?: string | null;
      error?: string;
    };
    if (!data.path || !data.content) return null;
    return { path: data.path, content: data.content };
  } catch {
    return null;
  }
}

export async function postDispatch(
  token: string,
  body: { kind: 'task' | 'question'; id: string; answer?: string; context?: string },
): Promise<string | null> {
  try {
    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return data.error ?? `HTTP ${res.status}`;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

export type AskBearing = { source: string; text: string; ref?: string };
export type AskResult = {
  bearings: AskBearing[];
  answer?: string;
  answerError?: string;
  agentConfigured: boolean;
};

export async function postAsk(
  token: string,
  question: string,
  transcript: { q: string; a: string }[],
): Promise<AskResult | { error: string }> {
  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ question, transcript }),
    });
    const data = (await res.json().catch(() => ({}))) as AskResult & { error?: string };
    if (!res.ok) return { error: data.error ?? `HTTP ${res.status}` };
    return data;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export type DecisionPost = {
  gateId: string;
  decision: 'approve' | 'reject' | 'request_changes';
  comment: string;
  steps: { text: string; checked?: boolean; skippedReason?: string }[];
};

export async function postDecision(
  token: string,
  body: DecisionPost,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/decisions', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

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

export async function fetchDoctor(token: string): Promise<unknown | null> {
  try {
    const res = await fetch('/api/doctor', { headers: { authorization: `Bearer ${token}` } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// open the resolved file in the user's default app (macOS open) — best-effort
export async function openFileLocally(token: string, ref: string): Promise<void> {
  try {
    await fetch(`/api/open-file?ref=${encodeURIComponent(ref.split('#')[0] ?? ref)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
  } catch {
    // silent: this is a convenience shortcut, not a data operation
  }
}

// sourceRef = "gdd.md#movement-ranges" → fetch the doc text; anchor stays client-side
export async function fetchDoc(
  token: string,
  ref: string,
): Promise<{ text: string } | { error: string }> {
  const file = ref.split('#')[0] ?? ref;
  try {
    const res = await fetch(`/api/doc/${file}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { error: `${file} — not available (HTTP ${res.status})` };
    return { text: await res.text() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchHuddle(token: string): Promise<unknown | null> {
  try {
    const res = await fetch('/api/huddle', { headers: { authorization: `Bearer ${token}` } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
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
