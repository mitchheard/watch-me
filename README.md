# 🎬 Watch Me

A full-stack personal watchlist app to track movies and TV shows you want to watch, are watching, or have finished.

Built with:

- [Next.js 14](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma ORM](https://www.prisma.io/)
- [SQLite (local dev)](https://www.sqlite.org/)
- Ready to swap to PostgreSQL and support authentication

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

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000 in your browser to see the app.

You can start editing the app by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## 🧪 Features

- Add shows and movies to your watchlist
- Track status: watching, finished, or want-to-watch
- Filter and organize items
- Full CRUD API via the Next.js App Router
- Tailwind-styled responsive UI

## 🗂 Folder Structure

```
/frontend      → Full Next.js app (UI + API + DB client)
/backend       → (Optional) Scripts, tools, infra configs
```

## 🔜 Coming Soon

- Authentication (NextAuth.js)
- PostgreSQL deployment (Render/Supabase)
- Mobile-friendly PWA
- User-specific watchlists

## 📚 Learn More About the Stack

To learn more about the tools used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Deploying with Vercel](https://vercel.com/docs)

## 📦 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

## 🧠 Author

Made with 🧠 and 🎬 by [@mitchheard](https://github.com/mitchheard) 