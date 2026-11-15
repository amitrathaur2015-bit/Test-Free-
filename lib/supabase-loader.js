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
  if (!supabase) { alert('Supabase connect nahi hua: Vercel ki keys website tak nahi pahunchi.'); return; }
  try {
    const [jobs, topics, quizzes, questions] = await Promise.all([
      supabase.from('jobs').select('*').order('id'),
      supabase.from('topics').select('*').order('id'),
      supabase.from('quizzes').select('*').order('id'),
      supabase.from('questions').select('*').order('id'),
    ]);
    if (jobs.error || topics.error || quizzes.error || questions.error) {
  const err = jobs.error || topics.error || quizzes.error || questions.error;
  alert('Supabase load error: ' + err.message);
  return;
}

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

    db.nextJobId = Math.max(1, ...db.jobs.map(x => x.id + 1));
    db.nextTopicId = Math.max(1, ...db.topics.map(x => x.id + 1));
    db.nextQuizId = Math.max(1, ...db.quizzes.map(x => x.id + 1));
    db.nextQuestionId = Math.max(1, ...db.questions.map(x => x.id + 1));

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
    alert('Supabase load failed: ' + (e && e.message ? e.message : e));
  }
}
