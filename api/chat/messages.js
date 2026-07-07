// pages/api/chat/messages.js
import { getRoomMessages, sendRoomMessage, deleteMessage } from '../../../lib/store-extended';
import { getSession } from '../../../lib/store';

export default function handler(req, res) {
  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ error: 'roomId required' });

  if (req.method === 'GET') {
    const messages = getRoomMessages(roomId);
    return res.json({ messages });
  }

  if (req.method === 'POST') {
    const { userId, userName, avatar, text, isDoubt } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Empty message' });
    const msg = sendRoomMessage(roomId, userId, userName, avatar, text.trim(), isDoubt);
    return res.json({ message: msg });
  }

  if (req.method === 'DELETE') {
    const { msgId } = req.body;
    deleteMessage(roomId, msgId);
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
