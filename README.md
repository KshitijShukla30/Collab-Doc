# 🔄 Collaborative Editor

A **real-time collaborative document editor** with live cursors, multiplayer editing, and persistent storage. Built with modern web technologies.

![Demo](./demo.webp)

---

## ✨ Features

- **Real-Time Collaboration** – Multiple users can edit the same document simultaneously
- **Live Cursors** – See where other users are typing in real-time
- **Google OAuth & Guest Login** – Sign in with Google or continue as a guest
- **Document Management** – Create, share, and delete documents
- **Rich Text Editing** – Bold, italic, headings, lists, code blocks, and more
- **Persistent Storage** – Documents saved to MongoDB Atlas
- **Aurora UI** – Modern, premium dark theme with smooth animations

---

## 🛠️ Tech Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| Next.js 15 | Node.js + Express | MongoDB Atlas |
| TipTap Editor | WebSocket (y-websocket) | |
| Yjs (CRDT) | NextAuth.js | |
| Framer Motion | | |
| Tailwind CSS | | |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google OAuth credentials (optional, for Google login)

### 1. Clone the Repository

```bash
git clone https://github.com/KshitijShukla30/Collab-Doc.git
cd Collab-Doc
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/web && npm install

# Install backend dependencies
cd ../server && npm install
```

### 3. Configure Environment Variables

**Frontend (`apps/web/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3001

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Backend (`apps/server/.env`):**

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collab-editor
PORT=5000
```

### 4. Run Locally

```bash
# Terminal 1: Start Backend (port 5000)
cd apps/server && npm run dev

# Terminal 2: Start Frontend (port 3001)
cd apps/web && npm run dev
```

Visit `http://localhost:3001` 🎉

---

## ☁️ Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Set the **Root Directory** to `apps/web`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = Your Render backend URL
   - `NEXT_PUBLIC_WS_URL` = Your Render WebSocket URL (wss://)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID` (optional)
   - `GOOGLE_CLIENT_SECRET` (optional)

### Backend (Render)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `apps/server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
4. Add environment variable:
   - `MONGODB_URI`

---

## 📁 Project Structure

```
multiuser/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── app/
│   │   │   ├── page.js       # Dashboard
│   │   │   ├── login/        # Login page
│   │   │   └── editor/       # Editor page
│   │   └── components/
│   │
│   └── server/               # Express backend
│       └── src/
│           ├── index.js      # Server entry
│           ├── db/           # MongoDB models
│           └── routes/       # API routes
│
├── package.json
└── README.md
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents?userId=` | Get user's documents |
| POST | `/api/documents` | Create new document |
| GET | `/api/documents/:docId` | Get document by ID |
| PATCH | `/api/documents/:docId` | Update document title |
| DELETE | `/api/documents/:docId` | Delete document |

---

## 🤝 How It Works

1. **Yjs CRDT** – Handles conflict-free real-time sync between clients
2. **y-websocket** – WebSocket provider for Yjs synchronization
3. **TipTap** – Rich text editor built on ProseMirror
4. **NextAuth.js** – Authentication with Google OAuth and credential-based guest login

---

## 📝 License

MIT License - feel free to use this project for learning or building your own collaborative apps!

---

## 👤 Author

**Kshitij Shukla**

- GitHub: [@KshitijShukla30](https://github.com/KshitijShukla30)
