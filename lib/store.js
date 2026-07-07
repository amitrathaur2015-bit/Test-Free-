// In-memory "database" (simulates PostgreSQL tables)
// In production, replace with real PostgreSQL + Prisma/pg

const DB = {
  // ── JOBS (Naukri — Level 1) ──────────────────────────────────────────────
  jobs: [
    { id: 1, name: 'UP Police', icon: '👮', color: 'bg-blue-100 text-blue-700',
      description: 'Uttar Pradesh Police Constable & Sub-Inspector Exam',
      topicCount: 3, quizCount: 8, attempts: 4800, tags: ['UP', 'Police', 'State'] },
    { id: 2, name: 'SSC CGL', icon: '📋', color: 'bg-green-100 text-green-700',
      description: 'Staff Selection Commission Combined Graduate Level Exam',
      topicCount: 4, quizCount: 12, attempts: 7200, tags: ['SSC', 'Central', 'Graduate'] },
    { id: 3, name: 'Railway NTPC', icon: '🚆', color: 'bg-amber-100 text-amber-700',
      description: 'RRB Non-Technical Popular Category Recruitment',
      topicCount: 3, quizCount: 10, attempts: 5600, tags: ['Railway', 'RRB', 'Central'] },
    { id: 4, name: 'UPSC Civil Services', icon: '🏛️', color: 'bg-purple-100 text-purple-700',
      description: 'Union Public Service Commission IAS/IPS Exam',
      topicCount: 5, quizCount: 15, attempts: 3200, tags: ['UPSC', 'IAS', 'Central'] },
    { id: 5, name: 'Bank PO / Clerk', icon: '🏦', color: 'bg-teal-100 text-teal-700',
      description: 'IBPS & SBI Bank PO and Clerk Recruitment Exam',
      topicCount: 4, quizCount: 14, attempts: 6100, tags: ['Bank', 'IBPS', 'SBI'] },
  ],
  users: [
    { id: 1, name: 'Admin User', email: 'admin@testfree.com', password: 'admin123', role: 'admin', createdAt: '2024-01-01', avatar: 'A' },
    { id: 2, name: 'John Doe', email: 'john@example.com', password: 'pass123', role: 'user', createdAt: '2024-01-15', avatar: 'J' },
    { id: 3, name: 'Jane Smith', email: 'jane@example.com', password: 'pass123', role: 'user', createdAt: '2024-02-01', avatar: 'J' },
  ],
  topics: [
    { id: 1, name: 'Mathematics', icon: '📐', color: 'bg-blue-100 text-blue-700', quizCount: 3, description: 'Arithmetic, Algebra, Geometry and more', jobId: null },
    { id: 2, name: 'Science', icon: '🔬', color: 'bg-green-100 text-green-700', quizCount: 4, description: 'Physics, Chemistry, Biology concepts' },
    { id: 3, name: 'History', icon: '📜', color: 'bg-amber-100 text-amber-700', quizCount: 2, description: 'World history, civilizations and events' },
    { id: 4, name: 'Geography', icon: '🌍', color: 'bg-teal-100 text-teal-700', quizCount: 3, description: 'Countries, capitals, maps and more' },
    { id: 5, name: 'Technology', icon: '💻', color: 'bg-purple-100 text-purple-700', quizCount: 5, description: 'Computers, internet, AI and programming' },
    { id: 6, name: 'English', icon: '📝', color: 'bg-rose-100 text-rose-700', quizCount: 4, description: 'Grammar, vocabulary and comprehension' },
    { id: 7, name: 'General Knowledge', icon: '🧠', color: 'bg-indigo-100 text-indigo-700', quizCount: 6, description: 'Wide range of everyday topics' },
    { id: 8, name: 'Sports', icon: '⚽', color: 'bg-orange-100 text-orange-700', quizCount: 2, description: 'Football, cricket, olympics and more' },
  ],
  quizzes: [
    { id: 1, title: 'Basic Mathematics', topicId: 1, duration: 600, questionCount: 10, difficulty: 'Easy', attempts: 1240, createdAt: '2024-02-01' },
    { id: 2, title: 'Advanced Algebra', topicId: 1, duration: 900, questionCount: 15, difficulty: 'Hard', attempts: 430, createdAt: '2024-02-10' },
    { id: 3, title: 'Geometry Basics', topicId: 1, duration: 600, questionCount: 10, difficulty: 'Medium', attempts: 670, createdAt: '2024-03-01' },
    { id: 4, title: 'General Science Quiz', topicId: 2, duration: 600, questionCount: 10, difficulty: 'Easy', attempts: 980, createdAt: '2024-02-05' },
    { id: 5, title: 'Physics Fundamentals', topicId: 2, duration: 900, questionCount: 12, difficulty: 'Medium', attempts: 560, createdAt: '2024-02-20' },
    { id: 6, title: 'World History 101', topicId: 3, duration: 600, questionCount: 10, difficulty: 'Easy', attempts: 790, createdAt: '2024-03-05' },
    { id: 7, title: 'Technology & Computers', topicId: 5, duration: 600, questionCount: 10, difficulty: 'Easy', attempts: 1100, createdAt: '2024-03-10' },
    { id: 8, title: 'General Knowledge Challenge', topicId: 7, duration: 900, questionCount: 20, difficulty: 'Medium', attempts: 2300, createdAt: '2024-03-15' },
  ],
  questions: [
    // Math - Basic (quiz 1)
    { id: 1, quizId: 1, topicId: 1, question: 'What is 15 × 8?', options: ['100', '120', '130', '112'], correct: 1, explanation: '15 × 8 = 120' },
    { id: 2, quizId: 1, topicId: 1, question: 'What is the value of √144?', options: ['11', '12', '13', '14'], correct: 1, explanation: '√144 = 12 because 12 × 12 = 144' },
    { id: 3, quizId: 1, topicId: 1, question: 'What is 25% of 200?', options: ['40', '45', '50', '55'], correct: 2, explanation: '25% of 200 = 200 × 0.25 = 50' },
    { id: 4, quizId: 1, topicId: 1, question: 'What is the sum of angles in a triangle?', options: ['90°', '180°', '270°', '360°'], correct: 1, explanation: 'The sum of interior angles of any triangle is always 180°.' },
    { id: 5, quizId: 1, topicId: 1, question: 'Simplify: 3/4 + 1/4', options: ['4/4', '1', '2/4', 'Both A and B'], correct: 3, explanation: '3/4 + 1/4 = 4/4 = 1. So both A and B are correct.' },
    { id: 6, quizId: 1, topicId: 1, question: 'What is 2³?', options: ['6', '8', '9', '12'], correct: 1, explanation: '2³ = 2 × 2 × 2 = 8' },
    { id: 7, quizId: 1, topicId: 1, question: 'Which of the following is a prime number?', options: ['15', '21', '29', '35'], correct: 2, explanation: '29 is prime because it has no divisors other than 1 and itself.' },
    { id: 8, quizId: 1, topicId: 1, question: 'What is the area of a circle with radius 7? (Use π ≈ 22/7)', options: ['144 sq units', '154 sq units', '164 sq units', '174 sq units'], correct: 1, explanation: 'Area = πr² = (22/7) × 7 × 7 = 22 × 7 = 154 sq units' },
    { id: 9, quizId: 1, topicId: 1, question: 'If x + 5 = 12, what is x?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'x = 12 - 5 = 7' },
    { id: 10, quizId: 1, topicId: 1, question: 'What is the LCM of 4 and 6?', options: ['10', '12', '16', '24'], correct: 1, explanation: 'LCM(4, 6) = 12. Multiples of 4: 4,8,12... Multiples of 6: 6,12... Smallest common is 12.' },
    // Science (quiz 4)
    { id: 11, quizId: 4, topicId: 2, question: 'What is the chemical symbol for water?', options: ['WA', 'H2O', 'HO2', 'H2O2'], correct: 1, explanation: 'Water is H2O — two hydrogen atoms bonded to one oxygen atom.' },
    { id: 12, quizId: 4, topicId: 2, question: 'What planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], correct: 2, explanation: 'Mercury is the closest planet to the Sun in our solar system.' },
    { id: 13, quizId: 4, topicId: 2, question: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correct: 2, explanation: 'Plants absorb Carbon Dioxide (CO₂) during photosynthesis and release oxygen.' },
    { id: 14, quizId: 4, topicId: 2, question: 'What is the speed of light?', options: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10⁷ m/s', '3×10⁹ m/s'], correct: 0, explanation: 'Speed of light ≈ 3×10⁸ meters per second (300,000 km/s).' },
    { id: 15, quizId: 4, topicId: 2, question: 'Which organ pumps blood through the human body?', options: ['Lungs', 'Liver', 'Heart', 'Kidney'], correct: 2, explanation: 'The heart is the muscular organ that pumps blood throughout the circulatory system.' },
    { id: 16, quizId: 4, topicId: 2, question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Chloroplast'], correct: 2, explanation: 'Mitochondria produce ATP (energy) for the cell, earning them the nickname "powerhouse of the cell".' },
    { id: 17, quizId: 4, topicId: 2, question: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correct: 1, explanation: 'Carbon has atomic number 6, meaning it has 6 protons in its nucleus.' },
    { id: 18, quizId: 4, topicId: 2, question: 'What causes rainbows?', options: ['Wind', 'Refraction of light through water droplets', 'Reflection off clouds', 'UV radiation'], correct: 1, explanation: 'Rainbows are formed by refraction, dispersion, and reflection of sunlight in water droplets.' },
    { id: 19, quizId: 4, topicId: 2, question: "Newton's first law of motion is also known as:", options: ['Law of Acceleration', 'Law of Inertia', 'Law of Gravitation', 'Law of Action-Reaction'], correct: 1, explanation: "Newton's First Law (Law of Inertia) states that an object remains at rest or in motion unless acted upon by an external force." },
    { id: 20, quizId: 4, topicId: 2, question: 'What is photosynthesis?', options: ['Breaking down food for energy', 'Converting light energy into chemical energy', 'Movement of water in plants', 'Cell division'], correct: 1, explanation: 'Photosynthesis converts light energy (from sun) + CO₂ + water into glucose and oxygen.' },
    // History (quiz 6)
    { id: 21, quizId: 6, topicId: 3, question: 'Who was the first President of the United States?', options: ['Abraham Lincoln', 'Thomas Jefferson', 'George Washington', 'John Adams'], correct: 2, explanation: 'George Washington was the first President of the United States, serving 1789–1797.' },
    { id: 22, quizId: 6, topicId: 3, question: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: 2, explanation: 'World War II ended in 1945 — V-E Day (May 8) in Europe and V-J Day (September 2) in the Pacific.' },
    { id: 23, quizId: 6, topicId: 3, question: 'Who built the Great Wall of China?', options: ['Genghis Khan', 'Kublai Khan', 'Emperor Qin Shi Huang', 'Emperor Yongle'], correct: 2, explanation: 'Emperor Qin Shi Huang started the Great Wall construction around 221 BC to protect China from northern invasions.' },
    { id: 24, quizId: 6, topicId: 3, question: 'The French Revolution began in which year?', options: ['1776', '1789', '1799', '1804'], correct: 1, explanation: 'The French Revolution began in 1789 with the storming of the Bastille on July 14.' },
    { id: 25, quizId: 6, topicId: 3, question: 'Who was the first man to walk on the Moon?', options: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'John Glenn'], correct: 2, explanation: 'Neil Armstrong became the first human to walk on the Moon on July 20, 1969, during Apollo 11.' },
    { id: 26, quizId: 6, topicId: 3, question: 'Which ancient wonder was located in Alexandria, Egypt?', options: ['Hanging Gardens', 'Colossus of Rhodes', 'Great Pyramid', 'The Lighthouse'], correct: 3, explanation: 'The Lighthouse of Alexandria was one of the Seven Wonders of the Ancient World, located on the island of Pharos.' },
    { id: 27, quizId: 6, topicId: 3, question: 'India gained independence from Britain in which year?', options: ['1945', '1946', '1947', '1948'], correct: 2, explanation: 'India gained independence from British rule on August 15, 1947.' },
    { id: 28, quizId: 6, topicId: 3, question: 'Who was known as the "Maid of Orléans"?', options: ['Marie Curie', 'Cleopatra', 'Joan of Arc', 'Queen Victoria'], correct: 2, explanation: 'Joan of Arc was a French heroine who led military campaigns and was known as the Maid of Orléans.' },
    { id: 29, quizId: 6, topicId: 3, question: 'The Magna Carta was signed in which year?', options: ['1066', '1215', '1492', '1588'], correct: 1, explanation: 'The Magna Carta was signed by King John of England in 1215, limiting royal power.' },
    { id: 30, quizId: 6, topicId: 3, question: 'Which empire was ruled by Genghis Khan?', options: ['Ottoman Empire', 'Roman Empire', 'Mongol Empire', 'British Empire'], correct: 2, explanation: 'Genghis Khan founded the Mongol Empire in 1206, which became the largest contiguous land empire in history.' },
    // Technology (quiz 7)
    { id: 31, quizId: 7, topicId: 5, question: 'What does "CPU" stand for?', options: ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Utility', 'Core Processing Unit'], correct: 0, explanation: 'CPU stands for Central Processing Unit — the primary component of a computer that executes instructions.' },
    { id: 32, quizId: 7, topicId: 5, question: 'What does "HTML" stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Logic', 'Home Tool Markup Language'], correct: 0, explanation: 'HTML = HyperText Markup Language. It is the standard language for creating web pages.' },
    { id: 33, quizId: 7, topicId: 5, question: 'Which company developed the Android operating system?', options: ['Apple', 'Microsoft', 'Google', 'Samsung'], correct: 2, explanation: 'Android was developed by Android Inc., which was acquired by Google in 2005.' },
    { id: 34, quizId: 7, topicId: 5, question: 'What is the binary equivalent of decimal 10?', options: ['1000', '1010', '1100', '1001'], correct: 1, explanation: '10 in binary = 1010. (8+2 = 10)' },
    { id: 35, quizId: 7, topicId: 5, question: 'What does "Wi-Fi" stand for?', options: ['Wireless Fidelity', 'Wide Frequency', 'Wireless Fiber', 'Wire-Free Internet'], correct: 0, explanation: 'Wi-Fi stands for Wireless Fidelity — it is a technology for wireless local area networking.' },
    { id: 36, quizId: 7, topicId: 5, question: 'Which programming language is primarily used for web styling?', options: ['JavaScript', 'Python', 'CSS', 'Java'], correct: 2, explanation: 'CSS (Cascading Style Sheets) is used to control the visual presentation of web pages.' },
    { id: 37, quizId: 7, topicId: 5, question: 'What is the full form of "URL"?', options: ['Universal Resource Locator', 'Uniform Resource Locator', 'Unique Reference Link', 'Universal Reference Link'], correct: 1, explanation: 'URL = Uniform Resource Locator. It is the address of a resource on the internet.' },
    { id: 38, quizId: 7, topicId: 5, question: 'What is RAM?', options: ['Read-only Access Memory', 'Random Access Memory', 'Rapid Application Memory', 'Remote Access Module'], correct: 1, explanation: 'RAM (Random Access Memory) is volatile short-term memory used by computers to store working data.' },
    { id: 39, quizId: 7, topicId: 5, question: 'Which key combination is used to copy text?', options: ['Ctrl+X', 'Ctrl+V', 'Ctrl+C', 'Ctrl+Z'], correct: 2, explanation: 'Ctrl+C copies selected text. Ctrl+X cuts, Ctrl+V pastes, Ctrl+Z undoes.' },
    { id: 40, quizId: 7, topicId: 5, question: 'What does "AI" stand for in technology?', options: ['Automated Intelligence', 'Artificial Intelligence', 'Advanced Interface', 'Automated Interface'], correct: 1, explanation: 'AI = Artificial Intelligence — the simulation of human intelligence by machines.' },
    // General Knowledge (quiz 8)
    { id: 41, quizId: 8, topicId: 7, question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Rome'], correct: 2, explanation: 'Paris is the capital and largest city of France.' },
    { id: 42, quizId: 8, topicId: 7, question: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], correct: 2, explanation: 'There are 7 continents: Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, South America.' },
    { id: 43, quizId: 8, topicId: 7, question: 'What is the largest ocean on Earth?', options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], correct: 3, explanation: 'The Pacific Ocean is the largest and deepest ocean, covering about 46% of the world\'s water surface.' },
    { id: 44, quizId: 8, topicId: 7, question: 'Which is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correct: 1, explanation: 'The Nile River (6,650 km) is generally considered the longest river in the world.' },
    { id: 45, quizId: 8, topicId: 7, question: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Baht'], correct: 2, explanation: 'The currency of Japan is the Yen (¥).' },
    { id: 46, quizId: 8, topicId: 7, question: 'How many bones does an adult human body have?', options: ['186', '206', '226', '246'], correct: 1, explanation: 'An adult human body has 206 bones. Babies are born with about 270-300 bones which fuse over time.' },
    { id: 47, quizId: 8, topicId: 7, question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correct: 2, explanation: 'Mars is called the Red Planet because its surface is covered in iron oxide (rust) giving it a reddish appearance.' },
    { id: 48, quizId: 8, topicId: 7, question: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'Leo Tolstoy', 'William Shakespeare', 'Jane Austen'], correct: 2, explanation: 'Romeo and Juliet was written by William Shakespeare, likely between 1594 and 1596.' },
    { id: 49, quizId: 8, topicId: 7, question: 'What is the tallest mountain in the world?', options: ['K2', 'Mount Everest', 'Kangchenjunga', 'Makalu'], correct: 1, explanation: 'Mount Everest (8,848.86 m) is the highest mountain above sea level on Earth.' },
    { id: 50, quizId: 8, topicId: 7, question: 'What is the chemical symbol for Gold?', options: ['Gl', 'Go', 'Gd', 'Au'], correct: 3, explanation: 'Gold\'s chemical symbol is Au, from the Latin word "Aurum".' },
    { id: 51, quizId: 8, topicId: 7, question: 'What is the national language of Brazil?', options: ['Spanish', 'Portuguese', 'French', 'English'], correct: 1, explanation: 'Portuguese is the national language of Brazil, a legacy of Portuguese colonial rule.' },
    { id: 52, quizId: 8, topicId: 7, question: 'Which country has the most natural lakes?', options: ['Russia', 'USA', 'Canada', 'Finland'], correct: 2, explanation: 'Canada has the most natural lakes of any country, containing about 60% of the world\'s total lakes.' },
    { id: 53, quizId: 8, topicId: 7, question: 'What is the hardest natural substance on Earth?', options: ['Iron', 'Quartz', 'Diamond', 'Ruby'], correct: 2, explanation: 'Diamond is the hardest natural substance, rating 10 on the Mohs hardness scale.' },
    { id: 54, quizId: 8, topicId: 7, question: 'In which year did the Titanic sink?', options: ['1910', '1911', '1912', '1913'], correct: 2, explanation: 'The Titanic sank on April 15, 1912, after striking an iceberg in the North Atlantic Ocean.' },
    { id: 55, quizId: 8, topicId: 7, question: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correct: 1, explanation: 'A hexagon has 6 sides. "Hex" comes from Greek meaning "six".' },
    { id: 56, quizId: 8, topicId: 7, question: 'What is the largest country by area?', options: ['China', 'USA', 'Canada', 'Russia'], correct: 3, explanation: 'Russia is the largest country by area at approximately 17.1 million km², covering 11% of the Earth\'s land mass.' },
    { id: 57, quizId: 8, topicId: 7, question: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Donatello'], correct: 2, explanation: 'The Mona Lisa was painted by Leonardo da Vinci between 1503 and 1519.' },
    { id: 58, quizId: 8, topicId: 7, question: 'What is the boiling point of water at sea level?', options: ['90°C', '95°C', '100°C', '105°C'], correct: 2, explanation: 'Water boils at 100°C (212°F) at standard atmospheric pressure (sea level).' },
    { id: 59, quizId: 8, topicId: 7, question: 'What language is spoken in Australia?', options: ['British English', 'Australian English', 'French', 'Dutch'], correct: 1, explanation: 'Australian English is the predominant language spoken in Australia.' },
    { id: 60, quizId: 8, topicId: 7, question: 'How many players are on a standard football (soccer) team?', options: ['9', '10', '11', '12'], correct: 2, explanation: 'A standard football/soccer team has 11 players on the field, including the goalkeeper.' },
  ],
  results: [
    { id: 1, userId: 2, quizId: 1, score: 8, total: 10, percentage: 80, timeTaken: 420, date: '2024-03-10' },
    { id: 2, userId: 2, quizId: 4, score: 7, total: 10, percentage: 70, timeTaken: 380, date: '2024-03-12' },
    { id: 3, userId: 2, quizId: 8, score: 15, total: 20, percentage: 75, timeTaken: 720, date: '2024-03-14' },
    { id: 4, userId: 3, quizId: 1, score: 9, total: 10, percentage: 90, timeTaken: 300, date: '2024-03-11' },
    { id: 5, userId: 3, quizId: 7, score: 8, total: 10, percentage: 80, timeTaken: 410, date: '2024-03-13' },
  ],
  nextUserId: 4,
  nextJobId: 6,
  nextTopicId: 9,
  nextQuizId: 9,
  nextQuestionId: 61,
  nextResultId: 6,
};

// Simulate localStorage-like persistence (client-side)
let _db = null;

export function getDB() {
  if (typeof window === 'undefined') return DB;
  if (!_db) {
    try {
      const saved = localStorage.getItem('testfree_db');
      _db = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DB));
    } catch {
      _db = JSON.parse(JSON.stringify(DB));
    }
  }
  return _db;
}

export function saveDB() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('testfree_db', JSON.stringify(_db));
  } catch {}
}

export function resetDB() {
  _db = JSON.parse(JSON.stringify(DB));
  saveDB();
}

// Auth helpers
export function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem('testfree_session');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function setSession(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('testfree_session', JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('testfree_session');
}

// User operations
export function loginUser(email, password) {
  const db = getDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return null;
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export function registerUser(name, email, password) {
  const db = getDB();
  if (db.users.find(u => u.email === email)) return null;
  const newUser = {
    id: db.nextUserId++,
    name, email, password,
    role: 'user',
    createdAt: new Date().toISOString().split('T')[0],
    avatar: name[0].toUpperCase(),
  };
  db.users.push(newUser);
  saveDB();
  const { password: _, ...safeUser } = newUser;
  return safeUser;
}

// Quiz operations
export function getQuizWithQuestions(quizId) {
  const db = getDB();
  const quiz = db.quizzes.find(q => q.id === parseInt(quizId));
  if (!quiz) return null;
  const questions = db.questions.filter(q => q.quizId === parseInt(quizId));
  const topic = db.topics.find(t => t.id === quiz.topicId);
  return { ...quiz, questions, topic };
}

export function saveResult(userId, quizId, score, total, timeTaken) {
  const db = getDB();
  const result = {
    id: db.nextResultId++,
    userId, quizId, score, total,
    percentage: Math.round((score / total) * 100),
    timeTaken,
    date: new Date().toISOString().split('T')[0],
  };
  db.results.push(result);
  saveDB();
  return result;
}

export function getUserStats(userId) {
  const db = getDB();
  const results = db.results.filter(r => r.userId === userId);
  const totalScore = results.reduce((acc, r) => acc + r.score, 0);
  const totalPossible = results.reduce((acc, r) => acc + r.total, 0);
  const avgPercentage = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
    : 0;
  
  const recentActivity = results
    .slice(-5)
    .reverse()
    .map(r => {
      const quiz = db.quizzes.find(q => q.id === r.quizId);
      const topic = quiz ? db.topics.find(t => t.id === quiz.topicId) : null;
      return { ...r, quiz, topic };
    });
  
  return {
    totalAttempts: results.length,
    totalScore,
    totalPossible,
    avgPercentage,
    recentActivity,
  };
}

// Admin operations
export function addQuestion(data) {
  const db = getDB();
  const question = { id: db.nextQuestionId++, ...data };
  db.questions.push(question);
  
  // Update quiz question count
  const quiz = db.quizzes.find(q => q.id === data.quizId);
  if (quiz) quiz.questionCount = db.questions.filter(q => q.quizId === data.quizId).length;
  
  saveDB();
  return question;
}

export function editQuestion(id, data) {
  const db = getDB();
  const idx = db.questions.findIndex(q => q.id === id);
  if (idx === -1) return null;
  db.questions[idx] = { ...db.questions[idx], ...data };
  saveDB();
  return db.questions[idx];
}

export function deleteQuestion(id) {
  const db = getDB();
  const idx = db.questions.findIndex(q => q.id === id);
  if (idx === -1) return false;
  db.questions.splice(idx, 1);
  saveDB();
  return true;
}

export function addTopic(data) {
  const db = getDB();
  const topic = { id: db.nextTopicId++, quizCount: 0, ...data };
  db.topics.push(topic);
  saveDB();
  return topic;
}

export function addQuiz(data) {
  const db = getDB();
  const quiz = {
    id: db.nextQuizId++,
    questionCount: 0,
    attempts: 0,
    createdAt: new Date().toISOString().split('T')[0],
    ...data
  };
  db.quizzes.push(quiz);
  
  // Update topic quiz count
  const topic = db.topics.find(t => t.id === data.topicId);
  if (topic) topic.quizCount = db.quizzes.filter(q => q.topicId === data.topicId).length;
  
  saveDB();
  return quiz;
}

export function deleteQuiz(id) {
  const db = getDB();
  const idx = db.quizzes.findIndex(q => q.id === id);
  if (idx === -1) return false;
  db.quizzes.splice(idx, 1);
  // Also delete associated questions
  db.questions = db.questions.filter(q => q.quizId !== id);
  saveDB();
  return true;
}

export function getAllStats() {
  const db = getDB();
  return {
    totalUsers: db.users.filter(u => u.role === 'user').length,
    totalQuizzes: db.quizzes.length,
    totalQuestions: db.questions.length,
    totalAttempts: db.results.length,
    totalTopics: db.topics.length,
    users: db.users,
    topics: db.topics,
    quizzes: db.quizzes,
    questions: db.questions,
    results: db.results,
  };
}

// ─── LEADERBOARD HELPERS ────────────────────────────────────────────────────

export function getLeaderboard(type = 'global', topicId = null) {
  const db = getDB();
  const now = new Date();

  const filterByDate = (results) => {
    if (type === 'daily') {
      const today = now.toISOString().split('T')[0];
      return results.filter(r => r.date === today);
    }
    if (type === 'weekly') {
      const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0];
      return results.filter(r => r.date >= weekAgo);
    }
    if (type === 'monthly') {
      const monthAgo = new Date(now - 30 * 86400000).toISOString().split('T')[0];
      return results.filter(r => r.date >= monthAgo);
    }
    return results;
  };

  let results = filterByDate(db.results);

  if (topicId) {
    const topicQuizIds = db.quizzes.filter(q => q.topicId === parseInt(topicId)).map(q => q.id);
    results = results.filter(r => topicQuizIds.includes(r.quizId));
  }

  // Aggregate per user
  const userMap = {};
  results.forEach(r => {
    if (!userMap[r.userId]) userMap[r.userId] = { userId: r.userId, totalScore: 0, totalPossible: 0, attempts: 0, bestPct: 0 };
    userMap[r.userId].totalScore += r.score;
    userMap[r.userId].totalPossible += r.total;
    userMap[r.userId].attempts += 1;
    if (r.percentage > userMap[r.userId].bestPct) userMap[r.userId].bestPct = r.percentage;
  });

  return Object.values(userMap)
    .map(u => {
      const user = db.users.find(usr => usr.id === u.userId);
      return {
        ...u,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '?',
        avgPct: u.totalPossible > 0 ? Math.round((u.totalScore / u.totalPossible) * 100) : 0,
      };
    })
    .sort((a, b) => b.avgPct - a.avgPct || b.attempts - a.attempts)
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

// ─── ANALYTICS HELPERS ──────────────────────────────────────────────────────

export function getAnalytics(userId) {
  const db = getDB();
  const results = db.results.filter(r => r.userId === userId);

  // Topic-wise breakdown
  const topicMap = {};
  results.forEach(r => {
    const quiz = db.quizzes.find(q => q.id === r.quizId);
    if (!quiz) return;
    const topic = db.topics.find(t => t.id === quiz.topicId);
    if (!topic) return;
    if (!topicMap[topic.id]) topicMap[topic.id] = { topicId: topic.id, name: topic.name, icon: topic.icon, correct: 0, total: 0, attempts: 0 };
    topicMap[topic.id].correct += r.score;
    topicMap[topic.id].total += r.total;
    topicMap[topic.id].attempts += 1;
  });

  const topicPerf = Object.values(topicMap).map(t => ({
    ...t,
    accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
  })).sort((a, b) => b.accuracy - a.accuracy);

  const strong = topicPerf.filter(t => t.accuracy >= 70);
  const weak = topicPerf.filter(t => t.accuracy < 70);

  // Progress over time (last 10 results)
  const progress = results.slice(-10).map((r, i) => {
    const quiz = db.quizzes.find(q => q.id === r.quizId);
    return { label: quiz?.title?.slice(0, 10) || `Quiz ${i + 1}`, percentage: r.percentage, date: r.date };
  });

  // Overall accuracy
  const totalCorrect = results.reduce((s, r) => s + r.score, 0);
  const totalQs = results.reduce((s, r) => s + r.total, 0);
  const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

  return { topicPerf, strong, weak, progress, accuracy, totalCorrect, totalQs };
}

// ─── QUIZ HISTORY HELPERS ───────────────────────────────────────────────────

export function getQuizHistory(userId) {
  const db = getDB();
  return db.results
    .filter(r => r.userId === userId)
    .reverse()
    .map(r => {
      const quiz = db.quizzes.find(q => q.id === r.quizId);
      const topic = quiz ? db.topics.find(t => t.id === quiz.topicId) : null;
      return { ...r, quiz, topic };
    });
}

export function getUserRank(userId) {
  const lb = getLeaderboard('global');
  const entry = lb.find(e => e.userId === userId);
  return entry ? entry.rank : null;
}

// ─── LIVE / NOTIFICATION HELPERS ────────────────────────────────────────────

export function getLiveOnlineCount() {
  // Simulated — in production use Socket.io server
  return Math.floor(Math.random() * 80) + 20;
}

export function getNotifications(userId) {
  const db = getDB();
  const results = db.results.filter(r => r.userId === userId);
  const notifs = [];
  if (results.length === 1) notifs.push({ id: 1, type: 'achievement', msg: '🎉 First quiz completed!', time: results[0].date });
  if (results.some(r => r.percentage === 100)) notifs.push({ id: 2, type: 'perfect', msg: '⭐ Perfect score achieved!', time: new Date().toISOString().split('T')[0] });
  if (results.length >= 3) notifs.push({ id: 3, type: 'streak', msg: '🔥 3 quizzes done — keep going!', time: new Date().toISOString().split('T')[0] });
  notifs.push({ id: 4, type: 'info', msg: '📢 New quizzes added in Science!', time: new Date().toISOString().split('T')[0] });
  return notifs;
}

// ── JOB (NAUKRI) FUNCTIONS ──────────────────────────────────────────────────

export function addJob(data) {
  const db = getDB();
  const job = {
    id: db.nextJobId++,
    name: data.name,
    icon: data.icon || '📌',
    color: data.color || 'bg-gray-100 text-gray-700',
    description: data.description || '',
    topicCount: 0,
    quizCount: 0,
    attempts: 0,
    tags: data.tags || [],
    createdAt: new Date().toISOString().split('T')[0],
  };
  db.jobs.push(job);
  saveDB();
  return job;
}

export function editJob(id, data) {
  const db = getDB();
  const job = db.jobs.find(j => j.id === parseInt(id));
  if (!job) return null;
  Object.assign(job, data);
  saveDB();
  return job;
}

export function deleteJob(id) {
  const db = getDB();
  // Also delete related topics and quizzes
  const topicIds = db.topics.filter(t => t.jobId === parseInt(id)).map(t => t.id);
  const quizIds = db.quizzes.filter(q => topicIds.includes(q.topicId)).map(q => q.id);
  db.questions = db.questions.filter(q => !quizIds.includes(q.quizId));
  db.quizzes = db.quizzes.filter(q => !topicIds.includes(q.topicId));
  db.topics = db.topics.filter(t => t.jobId !== parseInt(id));
  db.jobs = db.jobs.filter(j => j.id !== parseInt(id));
  saveDB();
}

export function getJobTopics(jobId) {
  const db = getDB();
  return db.topics.filter(t => t.jobId === parseInt(jobId));
}

export function getJobStats(jobId) {
  const db = getDB();
  const topics = db.topics.filter(t => t.jobId === parseInt(jobId));
  const topicIds = topics.map(t => t.id);
  const quizzes = db.quizzes.filter(q => topicIds.includes(q.topicId));
  const quizIds = quizzes.map(q => q.id);
  const questions = db.questions.filter(q => quizIds.includes(q.quizId));
  const attempts = db.results.filter(r => quizIds.includes(r.quizId)).length;
  return { topicCount: topics.length, quizCount: quizzes.length, questionCount: questions.length, attempts };
}

export function syncJobCounts() {
  const db = getDB();
  db.jobs.forEach(job => {
    const stats = getJobStats(job.id);
    job.topicCount = stats.topicCount;
    job.quizCount = stats.quizCount;
    job.attempts = stats.attempts;
  });
  saveDB();
}

// ─── TOPIC DELETE / EDIT ─────────────────────────────────────────────────────

export function editTopic(id, data) {
  const db = getDB();
  const topic = db.topics.find(t => t.id === parseInt(id));
  if (!topic) return;
  Object.assign(topic, data);
  saveDB();
}

export function deleteTopic(id) {
  const db = getDB();
  const topicId = parseInt(id);

  // Find all quizzes under this topic
  const quizIds = db.quizzes.filter(q => q.topicId === topicId).map(q => q.id);

  // Delete all questions belonging to those quizzes
  db.questions = db.questions.filter(q => !quizIds.includes(q.quizId));

  // Delete all quizzes under this topic
  db.quizzes = db.quizzes.filter(q => q.topicId !== topicId);

  // Delete all results tied to those quizzes
  db.results = db.results.filter(r => !quizIds.includes(r.quizId));

  // Finally delete the topic itself
  db.topics = db.topics.filter(t => t.id !== topicId);

  saveDB();
}
