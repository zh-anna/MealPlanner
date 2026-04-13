# MealPlanner

A personal meal planning app I built to solve a pretty specific problem: I wanted to track weekly meals and macros without the bloat of existing apps. Built with Expo (React Native) — runs on iOS, Android, and web from a single codebase.

## Features

- **Weekly meal schedule** — breakfast, lunch, and dinner planned for each day of the week with daily macro totals (calories, protein, fat, carbs)
- **Meal replacement** — swap any meal with alternatives that still fit your daily macro goals
- **Shopping list** — automatically aggregated from meal ingredients; view by day or for the rest of the week, with checkboxes for progress tracking
- **Body stats tracking** — log weight and body measurements (chest, underbust, waist, hips) over time with interactive line charts
- **Account** — name, avatar from gallery with resize and upload to cloud storage

## Stack

- **Expo 54** + React Native 0.81 + TypeScript
- **Expo Router** — file-based navigation
- **Zustand** — state management with AsyncStorage persistence
- **NativeWind** — Tailwind CSS utility classes for React Native
- **Supabase** — PostgreSQL database, Storage, Auth
- **react-native-gifted-charts** — charts for the stats screen
- **expo-image** · **expo-image-manipulator** — image loading and pre-upload optimization

## Design System

One of the more interesting parts of this project is the token pipeline. Design tokens (colors, spacing, typography, border radii) are defined once in `constants/tokens.ts` and compiled into `constants/tokens.generated.json` via a build script. Tailwind picks them up from there — so the design system stays in sync across the component library automatically.

```text
constants/tokens.ts
      ↓ npm run tokens:build
constants/tokens.generated.json
      ↓
tailwind.config.js → NativeWind → components
```

The color palette is a warm, earthy scheme built around a primary yellow (`#F5D23D`) and accent pink (`#F283AF`) on cream backgrounds. Typography uses Geologica for headings and Manrope for body text.

The `UIText` component exposes a `tone` + `variant` API that keeps text styles consistent across screens without repeating style declarations:

```tsx
<UIText tone="secondary" variant="caption">
  Remaining week
</UIText>
```

## Backend (Supabase)

The second version moves from fully local state to a cloud backend, enabling data persistence and laying the ground for multi-user support.

**Auth** — shared session via `ensureSharedUserSession`; credentials live in `.env`, never committed.

**Profiles** — `profiles` table stores name and `avatar_url`; upserted on every change from the client.

**Storage** — `avatars` bucket with RLS: each user can only read and write under their own `{user_id}/` path. Avatars are served via signed URLs (`createSignedUrl`) — public GET is disabled.

**Image optimization** — before upload, photos are resized to max 512px on the long side and compressed to JPEG using `expo-image-manipulator`. Upload uses `expo-file-system/legacy` + `ArrayBuffer` for stable binary transfer in React Native.

**Migrations** — `supabase/migrations/` contains the full schema history (tables, RLS policies, Storage config). Committing migrations means any dev can reproduce the exact same database structure from scratch.

## Project Structure

```
app/              # Screens (Expo Router file-based routing)
  (tabs)/         # Tab navigator: Schedule, Shopping, Stats
  replace-meal.tsx  # Modal screen for meal swaps
components/
  ui/             # Card, UIText, Stat, MsIcon — core component library
  floating-tab-bar.tsx  # Custom tab bar with floating FAB
constants/        # Design tokens + layout helpers
lib/              # Business logic: meal calculations, shopping aggregation, chart helpers
                  # + Supabase client, profile sync, avatar upload
stores/           # Zustand stores (meal plan + body stats)
types/            # TypeScript types for meals and body stats
supabase/
  migrations/     # PostgreSQL schema, RLS policies, Storage setup
scripts/
  build-tokens.mjs # Token compilation script
```

## A Few Implementation Notes

**Meal generation** — the weekly menu is generated randomly from the meal database (stored in Supabase), with each day's meals checked against daily macro goals. The replacement flow filters available options so only meals that keep totals within goal are shown.

**Shopping list aggregation** — ingredients are merged by name and unit across all relevant days, so "100г гречки" across three dinners correctly shows as "300г" on the list.

**Persistent state** — both Zustand stores use `persist` middleware with schema versioning, so local data survives app updates and can be migrated forward cleanly.

**Tab bar** — custom floating tab bar with a glassmorphism blur effect (using `expo-blur`) and a FAB button for quick stats logging. Haptic feedback on all interactions.

**Avatar privacy** — the public URL from Supabase Storage is never stored directly. Every render fetches a short-lived signed URL, so avatars are inaccessible without a valid session even if someone knows the bucket path.
