import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getDB } from '../../lib/store';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function Topics() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const db = getDB();
    setTopics(db.topics);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-gray-900 mb-2">All Topics</h1>
          <p className="text-gray-500">Choose a topic to explore quizzes</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {topics.map(topic => (
            <Link key={topic.id} href={`/topics/${topic.id}`}
              className="card hover:shadow-md hover:border-indigo-200 transition-all duration-200 group flex flex-col">
              <div className="text-4xl mb-3">{topic.icon}</div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{topic.name}</h3>
              <p className="text-xs text-gray-400 mt-1 mb-3 flex-1">{topic.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{topic.quizCount} quizzes</span>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
