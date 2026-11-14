import { supabase } from './supabase';

const TABLES = [
  {
    name: 'jobs',
    list: db => db.jobs || [],
    row: j => ({
      id: j.id, name: j.name, icon: j.icon ?? null, color: j.color ?? null,
      description: j.description ?? null, tags: j.tags || [],
      created_at: j.createdAt ?? null,
    }),
  },
  {
    name: 'topics',
    list: db => db.topics || [],
    row: t => ({
      id: t.id, name: t.name, icon: t.icon ?? null, color: t.color ?? null,
      description: t.description ?? null, job_id: t.jobId ?? null,
    }),
  },
  {
    name: 'quizzes',
    list: db => db.quizzes || [],
    row: q => ({
      id: q.id, title: q.title, topic_id: q.topicId ?? null,
      duration: q.duration ?? 600, difficulty: q.difficulty ?? 'Medium',
      passing_marks: q.passingMarks ?? 60, published: q.published !== false,
      created_at: q.createdAt ?? null,
    }),
  },
  {
    name: 'questions',
    list: db => db.questions || [],
    row: q => ({
      id: q.id, quiz_id: q.quizId, topic_id: q.topicId ?? null,
      question: q.question, options: q.options, correct: q.correct,
      explanation: q.explanation ?? null,
    }),
  },
];

let snapshot = null;
let running = false;
let pending = null;

function buildSnapshot(db) {
  const snap = {};
  TABLES.forEach(t => {
    const m = new Map();
    t.list(db).forEach(item => {
      const r = t.row(item);
      m.set(r.id, { row: r, json: JSON.stringify(r) });
    });
    snap[t.name] = m;
  });
  return snap;
}

export function setSnapshot(db) {
  snapshot = buildSnapshot(db);
}

export async function syncToSupabase(db) {
  if (!supabase || !snapshot) return;
  if (running) { pending = db; return; }
  running = true;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data || !data.session) return;

    const next = buildSnapshot(db);

    for (const t of TABLES) {
      const rows = [];
      next[t.name].forEach((v, id) => {
        const old = snapshot[t.name].get(id);
        if (!old || old.json !== v.json) rows.push(v.row);
      });
      if (rows.length) {
        const { error } = await supabase.from(t.name).upsert(rows);
        if (error) throw error;
      }
    }

    for (const t of [...TABLES].reverse()) {
      const ids = [];
      snapshot[t.name].forEach((v, id) => {
        if (!next[t.name].has(id)) ids.push(id);
      });
      if (ids.length) {
        const { error } = await supabase.from(t.name).delete().in('id', ids);
        if (error) throw error;
      }
    }

    snapshot = next;
  } catch (e) {
    console.error('Supabase sync failed', e);
  } finally {
    running = false;
    if (pending) {
      const p = pending;
      pending = null;
      syncToSupabase(p);
    }
  }
}
