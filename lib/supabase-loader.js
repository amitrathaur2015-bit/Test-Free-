import { supabase } from './supabase';
import { getDB, saveDB } from './store';

export async function loadFromSupabase() {
  if (!supabase) return;
  try {
    const [jobs, topics, quizzes, questions] = await Promise.all([
      supabase.from('jobs').select('*').order('id'),
      supabase.from('topics').select('*').order('id'),
      supabase.from('quizzes').select('*').order('id'),
      supabase.from('questions').select('*').order('id'),
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
      createdAt: q.created_at, questionCount: 0, attempts: 0,
    }));

    db.questions = questions.data.map(q => ({
      id: q.id, quizId: q.quiz_id, topicId: q.topic_id, question: q.question,
      options: q.options, correct: q.correct, explanation: q.explanation,
    }));

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

    saveDB();
  } catch (e) {
    console.error('Supabase load failed', e);
  }
}
