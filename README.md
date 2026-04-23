# FAVAP — Connect, Share, Stream, Build

A unified social platform combining **messaging** (WhatsApp), **social feed** (X/Twitter), **video streaming** (YouTube), and **communities** (Discord).

## 🚀 Features

### 💬 Messaging (WhatsApp-like)
- Real-time 1-on-1 and group chats
- Message delivery status (sent, delivered, read)
- Media sharing (images, videos, documents)
- Online/offline presence indicators
- Typing indicators

### 📰 Social Feed (X/Twitter-like)
- Post text, images, videos
- Like, comment, repost
- Follow/unfollow users
- Trending hashtags
- Infinite scroll timeline

### 🎬 Video Platform (YouTube-like)
- Upload and stream videos
- Like, comment, subscribe
- Category filtering
- Video upload with thumbnails

### 🏰 Communities (Discord-like)
- Create and join servers
- Text and voice channels
- Role-based permissions (owner, admin, mod, member)
- Real-time channel messaging

### 👤 User System
- Email/password & OAuth (Google, GitHub)
- User profiles with cover photos
- Follow system with counts
- Privacy settings & blocking

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Auth & DB | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Animations | Framer Motion |
| Icons | Lucide React |

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- npm
- Supabase account

### 1. Clone & Install
```bash
git clone <repo-url>
cd favap
npm install
```

### 2. Set up Supabase
1. Create a new Supabase project
2. Run the schema in `supabase/schema.sql` in the SQL Editor
3. Enable Realtime on tables: messages, channel_messages, profiles, notifications
4. Create a `media` storage bucket (set to public)
5. Enable Auth providers (Email, Google, GitHub)

### 3. Configure Environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## 🐳 Docker

```bash
docker-compose up --build
```

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (main)/          # Protected app pages
│   │   ├── feed/        # Social timeline
│   │   ├── messages/    # Chat system
│   │   ├── videos/      # Video platform
│   │   ├── communities/ # Discord-like servers
│   │   ├── profile/     # User profiles
│   │   ├── search/      # Global search
│   │   └── notifications/
│   ├── auth/callback/   # OAuth callback
│   └── api/             # API routes
├── components/
│   └── layout/          # Sidebar, TopBar, MobileNav
├── stores/              # Zustand state stores
├── lib/                 # Supabase client, utilities
└── middleware.js         # Route protection
```

## 📄 License

MIT
