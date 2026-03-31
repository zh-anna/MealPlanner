# MealPlanner

A personal meal planning app I built to solve a pretty specific problem: I wanted to track weekly meals and macros without the bloat of existing apps. Built with Expo (React Native) — runs on iOS, Android, and web from a single codebase.

---

## Features

- **Weekly meal schedule** — breakfast, lunch, and dinner planned for each day of the week with daily macro totals (calories, protein, fat, carbs)
- **Meal replacement** — swap any meal with alternatives that still fit your daily macro goals
- **Shopping list** — automatically aggregated from meal ingredients; view by day or for the rest of the week, with checkboxes for progress tracking
- **Body stats tracking** — log weight and body measurements (chest, underbust, waist, hips) over time with interactive line charts

All data is stored locally — no accounts, no backend, fully offline.

---

## Stack

- **Expo 54** + **React Native 0.81** + **TypeScript**
- **Expo Router** — file-based navigation
- **Zustand** — state management with AsyncStorage persistence
- **NativeWind** — Tailwind CSS utility classes for React Native
- **react-native-gifted-charts** — charts for the stats screen

---

## Design System

One of the more interesting parts of this project is the token pipeline. Design tokens (colors, spacing, typography, border radii) are defined once in `constants/tokens.ts` and compiled into `constants/tokens.generated.json` via a build script. Tailwind picks them up from there — so the design system stays in sync across the component library automatically.

```
constants/tokens.ts
      ↓ npm run tokens:build
constants/tokens.generated.json
      ↓
tailwind.config.js → NativeWind → components
```

The color palette is a warm, earthy scheme built around a primary yellow (`#F5D23D`) and accent pink (`#F283AF`) on cream backgrounds. Typography uses **Geologica** for headings and **Manrope** for body text.

The `UIText` component exposes a `tone` + `variant` API that keeps text styles consistent across screens without repeating style declarations:

```tsx
<UIText tone="secondary" variant="caption">
  Remaining week
</UIText>
```

---

## Project Structure

```
app/              # Screens (Expo Router file-based routing)
  (tabs)/         # Tab navigator: Schedule, Shopping, Stats
  replace-meal.tsx  # Modal screen for meal swaps
components/
  ui/             # Card, UIText, Stat, MsIcon — core component library
  floating-tab-bar.tsx  # Custom tab bar with floating FAB
constants/        # Design tokens + layout helpers
data/
  meals.json      # Meal database: 47 meals with ingredients and macros
lib/              # Business logic: meal calculations, shopping aggregation, chart helpers
stores/           # Zustand stores (meal plan + body stats)
types/            # TypeScript types for meals and body stats
scripts/
  build-tokens.ts # Token compilation script
```

---

## Getting Started

```bash
npm install
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Browser
```

The `tokens:build` script runs automatically before each platform command via `pre*` hooks, so the Tailwind config is always up to date.

---

## A Few Implementation Notes

**Meal generation** — the weekly menu is generated randomly from the meal database, with each day's meals checked against daily macro goals. The replacement flow filters available options so only meals that keep totals within goal are shown.

**Shopping list aggregation** — ingredients are merged by name and unit across all relevant days, so "100г гречки" across three dinners correctly shows as "300г" on the list.

**Persistent state** — both Zustand stores use `persist` middleware with schema versioning, so local data survives app updates and can be migrated forward cleanly.

**Tab bar** — custom floating tab bar with a glassmorphism blur effect (using `expo-blur`) and a FAB button for quick stats logging. Haptic feedback on all interactions.