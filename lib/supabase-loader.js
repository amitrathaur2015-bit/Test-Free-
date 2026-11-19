import { supabase } from './supabase';
import { getDB, saveDB } from './store';
import { setSnapshot, syncToSupabase } from './supabase-sync';

let hooked = false;

function installSyncHook() {
  if (hooked || typeof window === 'undefined') return;
  hooked = true;
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    original.apply(this, arguments);
    if (this === window.localStorage && key === 'testfree_db') {
      try {
        syncToSupabase(JSON.parse(value));
      } catch (e) {}
    }
  };
}

export async function loadFromSupabase() {
  if (!supabase) return;
  try {
    const [jobs, topics, quizzes, questions, profiles, results] = await Promise.all([
      supabase.from('jobs').select('*').order('id'),
      supabase.from('topics').select('*').order('id'),
      supabase.from('quizzes').select('*').order('id'),
      supabase.from('questions').select('*').order('id'),
      supabase.from('profiles').select('id,name,avatar,created_at'),
      supabase.from('results').select('*').order('id', { ascending: false }).limit(2000),
    ]);
    if (jobs.error || topics.error || quizzes.error || questions.error) return;

    const db = getDB();

    db.jobs = jobs.data.map(j => ({
      id: j.id, name: j.name, icon: j.icon, color: j.color,
      description: j.description, tags: j.tags || [],
      createdAt: j.created_at, topicCount: 0, quizCount: 0, attempts: 0,
    }));

    db.topics = topics.data.map(t => ({
      id: t.id, name: t.name, icon: t.icon, color: t.color,
      description: t.description, jobId: t.job_id, quizCount: 0,
    }));

    db.quizzes = quizzes.data.map(q => ({
      id: q.id, title: q.title, topicId: q.topic_id, duration: q.duration,
      difficulty: q.difficulty, passingMarks: q.passing_marks,
      published: q.published !== false,
      createdAt: q.created_at, questionCount: 0, attempts: 0,
    }));

    db.questions = questions.data.map(q => ({
      id: q.id, quizId: q.quiz_id, topicId: q.topic_id, question: q.question,
      options: q.options, correct: q.correct, explanation: q.explanation,
    }));

    if (!profiles.error && profiles.data) {
      db.users = profiles.data.map(p => ({
        id: p.id,
        name: p.name,
        email: '',
        role: 'user',
        avatar: p.avatar || (p.name ? p.name[0].toUpperCase() : '?'),
        createdAt: p.created_at ? String(p.created_at).slice(0, 10) : '',
      }));
    }

    if (!results.error && results.data) {
      db.results = results.data.slice().reverse().map(r => ({
        id: r.id,
        userId: r.user_id,
        quizId: r.quiz_id,
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        timeTaken: r.time_taken,
        date: r.date,
      }));
    }

    db.nextJobId = Math.max(1, ...db.jobs.map(x => x.id + 1));
    db.nextTopicId = Math.max(1, ...db.topics.map(x => x.id + 1));
    db.nextQuizId = Math.max(1, ...db.quizzes.map(x => x.id + 1));
    db.nextQuestionId = Math.max(1, ...db.questions.map(x => x.id + 1));
    db.nextResultId = Math.max(1, ...db.results.map(x => x.id + 1));

    db.quizzes.forEach(q => {
      q.questionCount = db.questions.filter(x => x.quizId === q.id).length;
      q.attempts = db.results.filter(r => r.quizId === q.id).length;
    });
    db.topics.forEach(t => {
      t.quizCount = db.quizzes.filter(q => q.topicId === t.id).length;
    });
    db.jobs.forEach(j => {
      const ids = db.topics.filter(t => t.jobId === j.id).map(t => t.id);
      const qs = db.quizzes.filter(q => ids.includes(q.topicId));
      j.topicCount = ids.length;
      j.quizCount = qs.length;
      j.attempts = db.results.filter(r => qs.some(q => q.id === r.quizId)).length;
    });

    setSnapshot(db);
    saveDB();
    installSyncHook();
  } catch (e) {
    console.error('Supabase load failed', e);
  }
}
