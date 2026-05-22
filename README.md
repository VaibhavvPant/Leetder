# Leetder

Leetder is a swipe-first coding problem discovery prototype inspired by Tinder. It learns from your likes, skips, and super likes to surface better problem recommendations while adding matchmaking humor for favorite topics like Graphs, Dynamic Programming, Trees, and Binary Search.

## What is in this MVP

- Swipeable problem cards with pointer gestures and keyboard shortcuts
- Topic compatibility scoring and animated match modal
- Difficulty-aware recommendation tuning
- Coding aura meter, emotional damage tracker, and drama feed
- Local persistence with `localStorage`

## Run it locally

Because this environment does not currently have `npm`, `pnpm`, `yarn`, or `corepack`, this version is intentionally built as a zero-build static app.

1. From the repo root, run:

```bash
python3 -m http.server 4173
```

2. Open [http://localhost:4173](http://localhost:4173)

## Controls

- Drag card left: skip the problem
- Drag card right: like the problem
- Drag card upward: super like the problem
- Keyboard shortcuts: left arrow, right arrow, up arrow
