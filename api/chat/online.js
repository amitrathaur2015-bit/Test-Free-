import { getOnlineUsers, setUserOnline } from '../../../lib/store-extended';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json({ users: getOnlineUsers() });
  }
  if (req.method === 'POST') {
    const { userId, userName, avatar } = req.body;
    if (userId) setUserOnline(userId, userName, avatar);
    return res.json({ ok: true });
  }
  res.status(405).end();
}
