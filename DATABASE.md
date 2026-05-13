# Database

> AvidX runs a single shared Supabase Postgres database ("AvidX Production"). Every product's tables live in the same instance. This repo's Prisma schema only describes this product's own tables — every other product's tables look like drift.

## Canonical policy

The authoritative reference is the Notion doc: **[🗄️ Prisma & Database Migration Policy](https://www.notion.so/35f67fabf8ff816bb78ce5e074fb237f)**. Read it before any Prisma work.

## 🚫 Banned commands

These must never run against AvidX Production:

- `prisma db push` — even without flags
- `prisma db push --accept-data-loss` — never, under any circumstances
- `prisma migrate reset` against production or any shared DB
- Direct `DROP TABLE` / `DROP SCHEMA` / `TRUNCATE` against production via any channel

## ✅ Required workflow

- **Local schema changes:** `prisma migrate dev --name <descriptive_name>` — inspect the generated migration before applying
- **Production deploys:** `prisma migrate deploy` — applies committed migrations only

## When Prisma reports drift you don't recognize

**STOP.** Drift you don't recognize usually means another product's tables. They are not yours to delete. Ask before doing anything.

## Incident origin

This policy exists because on May 11, 2026, `prisma db push --accept-data-loss` dropped four `signal_*` tables from the shared DB during a Watch Me schema change. See the [postmortem](https://www.notion.so/35e67fabf8ff813e9392d7bf99023b53) for the full story and recovery procedure.
