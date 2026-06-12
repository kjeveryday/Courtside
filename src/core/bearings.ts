// Ask Courtside, layer 1 (TASK-30): deterministic bearings. A question is
// matched against the live board and the project's markdown — every hit names
// its source and (for docs) carries an openable ref. Zero AI, zero cost; the
// agent layer on top only ever ADDS prose, never replaces these.
import type { CourtsideState } from '../contract/state.generated.ts';
import { githubSlug } from '../lib/anchors.ts';

export type Bearing = {
  source: string; // "board · TASK-13", "ledger · Q-7", "gdd.md#movement"
  text: string;
  ref?: string; // doc ref the viewer can open (file#anchor)
  score: number;
};

const STOP = new Set(
  (
    'the a an is are was were what whats how why do does did i my me we of to in on for it and ' +
    'or can could should where when who which this that you your with about there here'
  ).split(' '),
);

export function terms(question: string): string[] {
  return [
    ...new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !STOP.has(w)),
    ),
  ];
}

// Longest patterns first so G5-TASK-12 wins over its TASK-12 substring.
export function extractIds(question: string): string[] {
  const up = question.toUpperCase();
  return [...new Set(up.match(/\bG\d+-[A-Z0-9-]+\b|\b(?:TASK|DEC|Q|D)-\d+\b/g) ?? [])];
}

export function scoreText(qTerms: readonly string[], text: string): number {
  const t = text.toLowerCase();
  let s = 0;
  for (const w of qTerms) if (t.includes(w)) s += 1;
  return s;
}

const ID_HIT = 100; // an id named in the question always outranks keyword hits

export function stateBearings(state: CourtsideState, question: string): Bearing[] {
  const ids = extractIds(question);
  const qTerms = terms(question);
  const out: Bearing[] = [];
  const add = (source: string, text: string, idMatch: boolean) => {
    const score = (idMatch ? ID_HIT : 0) + scoreText(qTerms, text);
    if (score > 0) out.push({ source, text, score });
  };

  for (const t of state.tasks) {
    const text =
      `${t.id} "${t.title}" — ${t.status}` +
      (t.deps?.length ? `, deps ${t.deps.join(', ')}` : '') +
      (t.visualCriterion ? `. Visual: ${t.visualCriterion}` : '') +
      (t.commit ? ` (commit ${t.commit})` : '');
    add(`board · ${t.id}`, text, ids.includes(t.id));
  }
  for (const g of state.gates) {
    const text = `checkpoint ${g.id} — ${g.status}${g.taskId ? ` (reviews ${g.taskId})` : ''}, posted ${g.postedAt}`;
    add(`board · ${g.id}`, text, ids.includes(g.id));
  }
  for (const q of state.questions ?? []) {
    const text =
      `${q.id} (${q.status}) — ${q.text}` +
      (q.options?.length ? ` Options: ${q.options.join(' | ')}.` : '') +
      (q.recommendation ? ` Rec: ${q.recommendation}.` : '') +
      (q.blocking?.length ? ` Blocking ${q.blocking.join(', ')}.` : '');
    add(`ledger · ${q.id}`, text, ids.includes(q.id));
  }
  for (const d of state.debt ?? [])
    add(`ledger · ${d.id}`, `${d.id} (tech debt) — ${d.text}`, ids.includes(d.id));
  for (const d of state.decisions ?? [])
    add(`ledger · ${d.id}`, `${d.id} — ${d.text} (by ${d.by})`, ids.includes(d.id));

  add(
    'board · agent',
    `agent is ${state.agent.state}${state.agent.currentTask ? ` on ${state.agent.currentTask}` : ''} — "${state.agent.narration ?? ''}"`,
    false,
  );
  return out;
}

type Doc = { name: string; text: string };

export function docBearings(docs: readonly Doc[], question: string): Bearing[] {
  const ids = extractIds(question);
  const qTerms = terms(question);
  const out: Bearing[] = [];
  for (const doc of docs) {
    const lines = doc.text.split('\n');
    let heading = doc.name;
    let slug = '';
    let body: string[] = [];
    const flush = () => {
      const text = body.join(' ').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const idBonus = ids.some((id) => text.toUpperCase().includes(id)) ? ID_HIT / 2 : 0;
      const score = scoreText(qTerms, `${heading} ${text}`) + idBonus;
      if (score > 0)
        out.push({
          source: slug ? `${doc.name}#${slug}` : doc.name,
          ref: slug ? `${doc.name}#${slug}` : doc.name,
          text: `${heading}: ${text.slice(0, 280)}${text.length > 280 ? '…' : ''}`,
          score,
        });
      body = [];
    };
    for (const line of lines) {
      const h = /^#{1,4}\s+(.*)$/.exec(line);
      if (h) {
        flush();
        heading = h[1] ?? '';
        slug = githubSlug(heading);
      } else body.push(line);
    }
    flush();
  }
  return out;
}

export function gatherBearings(opts: {
  state?: CourtsideState;
  extra?: Bearing[]; // live server facts (decided gates, doctor, dispatches)
  docs: readonly Doc[];
  question: string;
  cap?: number;
}): Bearing[] {
  return [
    ...(opts.state ? stateBearings(opts.state, opts.question) : []),
    ...(opts.extra ?? []),
    ...docBearings(opts.docs, opts.question),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.cap ?? 12);
}
