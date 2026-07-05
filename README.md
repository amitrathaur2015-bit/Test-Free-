# TestFree — Complete Admin Panel (/admin2)

## Admin Panel Access
Visit `/admin2/login` and sign in with admin credentials.

**Admin Login:** `admin@testfree.com` / `admin123`

---

## Admin Panel Pages

### 1. Dashboard `/admin2`
- Live student count badge
- 6 stat cards: Users, Quizzes, Attempts, Questions, Avg Score, Topics
- Chart.js bar chart — 7-day attempt trend
- Score distribution mini-bars
- Top quizzes & top students tables
- Recent admin action log

### 2. User Management `/admin2/users`
- Full user table with search, role filter, status filter, sort
- Click any user → side panel with profile, stats, recent quiz history
- Ban/unban users
- Promote/demote to admin
- Delete user (with confirmation modal)
- Export all users to CSV

### 3. Quiz Management `/admin2/quizzes`
- Create quizzes (title, topic, duration, difficulty, passing marks)
- Publish / Unpublish quizzes (toggle)
- Create topics with emoji icons
- Add/Edit/Delete individual questions
- **Bulk import** — paste Q&A text and auto-parse MCQs
- Expand quiz rows to see all questions inline

### 4. PDF Library `/admin2/pdfs`
- Upload PDFs up to 400 MB
- Organize by category (Mathematics, Science, History, etc.)
- Add title, description, tags per PDF
- Track download counts
- Edit and delete PDFs
- Link to AI extractor

### 5. AI PDF Extractor `/admin2/pdf-upload-ai`
- Upload PDF → Claude AI extracts MCQ questions
- Real-time terminal log during processing
- Review all extracted questions (select/deselect)
- One-click quiz publication
- Auto-saves to PDF Library
- Quiz settings: title, topic, difficulty, passing marks

### 6. Chat Moderation `/admin2/chat`
- View all community rooms
- Search messages in each room
- Delete individual messages
- Clear entire room
- Ban/unban users from chat
- View list of chat-banned users

### 7. Notifications `/admin2/notifications`
- 6 pre-built announcement templates
- Custom title, body, target audience (All / Students / Admins)
- Preview notification before sending
- View all sent announcements
- Delete old announcements

### 8. Results & Analytics `/admin2/results`
- Platform overview stats
- Chart.js doughnut + line charts
- Most attempted quizzes table with avg scores
- Top performing students leaderboard
- Topic-wise performance breakdown
- Export quiz results to CSV

### 9. Activity Logs `/admin2/logs`
- Full admin action history with timestamps
- Filter by action type
- Search log entries
- Color-coded action badges

---

## All Pages (28 total)

| Student Pages | Admin Pages |
|---|---|
| `/` Home | `/admin2/login` |
| `/topics` | `/admin2` Dashboard |
| `/quiz/[id]` | `/admin2/users` |
| `/community` | `/admin2/quizzes` |
| `/leaderboard` | `/admin2/pdfs` |
| `/dashboard` | `/admin2/pdf-upload-ai` |
| `/analytics` | `/admin2/chat` |
| `/history` | `/admin2/notifications` |
| `/auth/login` | `/admin2/results` |
| `/auth/register` | `/admin2/logs` |

## Quick Start
```bash
npm install
npm run dev
```
Open http://localhost:3000

**Student:** john@example.com / pass123  
**Admin:** admin@testfree.com / admin123
