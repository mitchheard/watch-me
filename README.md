# 🎬 Watch Me

A full-stack personal watchlist app to track movies and TV shows you want to watch, are watching, or have finished.

## 🏗️ Tech Stack

**Frontend:**
- [Next.js 15](https://nextjs.org/) with App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Headless UI](https://headlessui.com/) for accessible components
- [Framer Motion](https://www.framer.com/motion/) for animations
- [React Hook Form](https://react-hook-form.com/) for form handling

**Backend & Database:**
- [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- [Supabase](https://supabase.com/) for authentication and database
- [TMDB API](https://www.themoviedb.org/documentation/api) for movie/TV data

**Authentication:**
- Google OAuth via Supabase Auth
- Session management with Supabase SSR

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/mitchheard/watch-me.git
cd watch-me/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file with:
```env
DATABASE_URL="your_postgresql_connection_string"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
TMDB_API_KEY="your_tmdb_api_key"
```

### 4. Set up the database
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run the development server
```bash
npm run dev
```

Open http://localhost:3000 in your browser to see the app.

## ✨ Current Features

- **User Authentication** - Google OAuth via Supabase
- **Movie & TV Show Tracking** - Add items to your watchlist
- **Status Management** - Track watching, finished, or want-to-watch status
- **Rich Metadata** - Automatic data from TMDB (posters, descriptions, ratings)
- **Season & Episode Tracking** - For TV shows
- **User Ratings & Notes** - Rate and add personal notes to items
- **Search & Filtering** - Find items by title, status, or type
- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Instant UI updates with optimistic rendering

## 🗂️ Project Structure

```
/frontend
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   │   ├── watchlist/       # Watchlist-specific components
│   │   └── ui/              # Generic UI components
│   ├── contexts/            # React contexts (Auth, etc.)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and configs
│   ├── types/               # TypeScript type definitions
│   └── generated/           # Generated types (Prisma, etc.)
├── prisma/                  # Database schema and migrations
└── public/                  # Static assets
```

## 🔜 Planned Features

- Social features (sharing watchlists)
- Recommendations based on watch history
- Export/import watchlist data
- Multiple watchlists per user
- Watch party functionality
- Mobile app version

## 🧠 Author

Made with 🧠 and 🎬 by [@mitchheard](https://github.com/mitchheard) 