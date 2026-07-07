import { getDB, saveDB } from '../../../lib/store';

export default function handler(req, res) {
  const db = getDB();

  if (req.method === 'GET') {
    const users = db.users.map(u => {
      const { password, ...safe } = u;
      const attempts = db.results.filter(r => r.userId === u.id).length;
      const avgPct = attempts > 0
        ? Math.round(db.results.filter(r => r.userId === u.id).reduce((s, r) => s + r.percentage, 0) / attempts)
        : 0;
      return { ...safe, attempts, avgPct };
    });
    return res.json({ users });
  }

  if (req.method === 'PATCH') {
    const { userId, action } = req.body;
    const user = db.users.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'ban') user.banned = true;
    if (action === 'unban') user.banned = false;
    if (action === 'makeAdmin') user.role = 'admin';
    if (action === 'makeUser') user.role = 'user';
    
    saveDB();
    return res.json({ ok: true, user });
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body;
    const idx = db.users.findIndex(u => u.id === parseInt(userId));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    db.users.splice(idx, 1);
    saveDB();
    return res.json({ ok: true });
  }

  res.status(405).end();
}
