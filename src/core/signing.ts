// HMAC-SHA256 decision chain (PRD §5/R7): each entry's mac covers its body AND
// the previous mac, so edits, deletions, and reorders all break verification.
// The secret lives outside git (.courtside/secret), created on first use.
import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type DecisionBody = {
  seq: number;
  ts: string;
  gateId: string;
  taskId?: string;
  decision: 'approve' | 'reject' | 'request_changes';
  comment: string;
  steps: { text: string; checked?: boolean; skippedReason?: string }[];
};

export type ChainEntry = DecisionBody & { prevMac: string; mac: string };

export function signEntry(secret: string, body: DecisionBody, prevMac: string): string {
  const canonical = JSON.stringify([
    body.seq,
    body.ts,
    body.gateId,
    body.taskId ?? '',
    body.decision,
    body.comment,
    body.steps,
    prevMac,
  ]);
  return createHmac('sha256', secret).update(canonical).digest('hex');
}

export function verifyChain(
  secret: string,
  entries: readonly ChainEntry[],
): { ok: true } | { ok: false; brokenAt: number } {
  let prevMac = '';
  for (const entry of entries) {
    const { mac, prevMac: claimedPrev, ...body } = entry;
    if (claimedPrev !== prevMac || signEntry(secret, body, prevMac) !== mac) {
      return { ok: false, brokenAt: entry.seq };
    }
    prevMac = mac;
  }
  return { ok: true };
}

export function loadOrCreateSecret(runtimeDir: string): string {
  const path = join(runtimeDir, 'secret');
  if (existsSync(path)) return readFileSync(path, 'utf-8').trim();
  mkdirSync(runtimeDir, { recursive: true });
  const secret = randomBytes(32).toString('hex');
  writeFileSync(path, secret, { mode: 0o600 });
  return secret;
}
